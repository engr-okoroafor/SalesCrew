"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData, inVendor } from "@/lib/client/data";
import { Card, Chevron, Field, Modal, PageHead, Stat, Tip, toast, money, Dots, ago } from "@/components/ui";
import { ChannelIcon } from "@/components/icons/ChannelIcons";
import { uid, type Lead, type Stage } from "@/lib/schema";
const STAGES: Stage[] = ["new", "contacted", "qualified", "proposal", "won", "paid", "nurture", "lost"]; const TYPES = ["B2B", "B2C", "Reseller", "Government", "NGO"] as const;
const blank = (vendorId: string): Lead => ({ id: uid("l"), vendorId, name: "", company: "", email: "", phone: "", source: "manual", channel: "whatsapp", segment: "", customerType: "B2C", interests: [], productIds: [], score: 0, stage: "new", value: 0, note: "", lang: "en", createdAt: new Date().toISOString(), tags: [] });
export default function Leads() {
  const { w, vendor, save, saveMany, del, api } = useData(); const r = useRouter();
  const [f, setF] = useState({ q: "", stage: "all", type: "all", seg: "all", cat: "all", kind: "all" }); const [sel, setSel] = useState<Set<string>>(new Set()); const [edit, setEdit] = useState<Lead | null>(null);
  const [gen, setGen] = useState(false); const [icp, setIcp] = useState({ city: "", customerTypes: [] as string[], segments: "", productIds: [] as string[], notes: "" }); const [found, setFound] = useState<Lead[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { const id = new URLSearchParams(location.search).get("id"); const l = w?.leads.find((x) => x.id === id); if (l) setEdit(l); }, [w]);
  const prods = useMemo(() => (w?.products ?? []).filter(inVendor(vendor)), [w, vendor]);
  const cats = [...new Set(prods.map((p) => p.category))]; const segs = [...new Set((w?.leads ?? []).map((l) => l.segment).filter(Boolean))];
  const list = useMemo(() => (w?.leads ?? []).filter(inVendor(vendor)).filter((l) => (f.stage === "all" || l.stage === f.stage) && (f.type === "all" || l.customerType === f.type) && (f.seg === "all" || l.segment === f.seg)
    && (f.cat === "all" || l.productIds.some((id) => prods.find((p) => p.id === id)?.category === f.cat)) && (f.kind === "all" || l.productIds.some((id) => prods.find((p) => p.id === id)?.kind === f.kind))
    && (!f.q || `${l.name} ${l.company} ${l.email} ${l.note} ${l.tags.join(" ")}`.toLowerCase().includes(f.q.toLowerCase()))).sort((a, b) => b.score - a.score), [w, vendor, f, prods]);
  if (!w) return null; const vid = vendor === "all" ? w.vendors[0].id : vendor; const cur = (id: string) => w.vendors.find((v) => v.id === id)?.currency ?? "NGN";
  const toggle = (id: string) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const pipeline = STAGES.slice(0, 7).map((s) => ({ s, n: list.filter((l) => l.stage === s).length, v: list.filter((l) => l.stage === s).reduce((a, l) => a + l.value, 0) }));
  return <div>
    <PageHead title="Leads" sub="Every lead from WhatsApp, Messenger, Instagram, calls, sites and AI prospecting — segmented by product category & customer type." right={<>
      <button className="btn-ghost" onClick={() => setGen(true)}>✨ Find leads with AI</button><button className="btn" onClick={() => setEdit(blank(vid))}>+ Add lead</button></>} />
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Leads" value={list.length} /><Stat label="Pipeline value" value={money(list.filter((l) => !["lost", "paid"].includes(l.stage)).reduce((a, l) => a + l.value, 0))} tip="Sum of open lead values (NGN-equivalent display)" />
      <Stat label="Hot (score ≥ 75)" value={list.filter((l) => l.score >= 75).length} /><Stat label="Paid" value={list.filter((l) => l.stage === "paid" || l.stage === "nurture").length} /></div>
    <div className="mb-4 flex gap-1 overflow-x-auto">{pipeline.map((p) => <button key={p.s} onClick={() => setF({ ...f, stage: f.stage === p.s ? "all" : p.s })} className={`group glass min-w-[120px] flex-1 p-2.5 text-left ${f.stage === p.s ? "glass-hi" : ""}`}><div className="label flex items-center justify-between">{p.s}<Chevron size={10} /></div><div className="font-bold">{p.n}</div><div className="text-[10px] text-white/40">{money(p.v)}</div></button>)}</div>
    <Card><div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
      <input className="inp col-span-2" placeholder="Search name, business, email, tag…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
      <select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="all">All customer types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <select className="inp" value={f.seg} onChange={(e) => setF({ ...f, seg: e.target.value })}><option value="all">All segments</option>{segs.map((t) => <option key={t}>{t}</option>)}</select>
      <select className="inp" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="all">Goods & services</option><option value="good">Goods</option><option value="service">Services</option></select>
      <select className="inp" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}><option value="all">All categories</option>{cats.map((t) => <option key={t}>{t}</option>)}</select></div>
      {sel.size > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#39ff88]/30 bg-[#39ff88]/5 p-2 text-sm"><b>{sel.size} selected</b>
        <button className="btn !py-1" onClick={() => r.push(`/app/outreach?leads=${[...sel].join(",")}`)}>Draft outreach <Chevron /></button>
        <button className="btn-ghost !py-1" onClick={() => r.push(`/app/calls?lead=${[...sel].join(",")}`)}>AI call</button>
        <select className="inp !w-auto !py-1" defaultValue="" onChange={async (e) => { await saveMany("leads", list.filter((l) => sel.has(l.id)).map((l) => ({ ...l, stage: e.target.value }))); toast("Stage updated"); }}><option value="" disabled>Move to stage…</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="ml-auto text-red-300" onClick={async () => { if (confirm(`Delete ${sel.size} leads?`)) { await del("leads", [...sel]); setSel(new Set()); } }}>Delete</button></div>}
      <div className="overflow-x-auto scroll-thin"><table className="w-full text-sm"><thead><tr className="text-left text-white/45"><th className="p-2"><input type="checkbox" className="ck" checked={sel.size === list.length && list.length > 0} onChange={(e) => setSel(e.target.checked ? new Set(list.map((l) => l.id)) : new Set())} /></th><th>Lead</th><th>Type / segment</th><th>Interest</th><th>Stage</th><th>Score</th><th>Value</th><th>Source</th><th /></tr></thead>
        <tbody>{list.map((l) => <tr key={l.id} className="group border-t border-white/5 hover:bg-white/[.03]"><td className="p-2"><input type="checkbox" className="ck" checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
          <td className="py-2"><div className="font-medium">{l.name}</div><div className="text-xs text-white/45">{l.company} {l.email && `· ${l.email}`}</div></td>
          <td><span className="chip">{l.customerType}</span> <span className="text-xs text-white/50">{l.segment}</span></td>
          <td className="max-w-[200px] text-xs">{l.productIds.map((id) => prods.find((p) => p.id === id)?.name ?? w.products.find((p) => p.id === id)?.name).filter(Boolean).join(", ") || l.interests.join(", ")}</td>
          <td><span className={`chip ${["won", "paid", "nurture"].includes(l.stage) ? "chip-on" : ""}`}>{l.stage}</span></td>
          <td><div className="h-1.5 w-16 rounded bg-white/10"><div className="h-full rounded bg-[#39ff88] shadow-[0_0_8px_#39ff88]" style={{ width: `${l.score}%` }} /></div><span className="text-[10px] text-white/40">{l.score}</span></td>
          <td>{money(l.value, cur(l.vendorId))}</td><td><Tip text={`${l.source} · ${ago(l.createdAt)} ago`}><span className="inline-flex items-center gap-1 text-xs">{["whatsapp", "messenger", "instagram"].includes(l.channel) ? <ChannelIcon ch={l.channel} size={14} /> : l.channel}</span></Tip></td>
          <td><button onClick={() => setEdit(l)} className="opacity-60 group-hover:opacity-100"><Chevron /></button></td></tr>)}</tbody></table>
        {!list.length && <p className="p-6 text-center text-white/40">No leads match. Clear filters or find new ones with AI.</p>}</div></Card>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.name ? `Edit ${edit.name}` : "New lead"} wide>{edit && <LeadForm l={edit} set={setEdit} onSave={async () => { await save("leads", edit); setEdit(null); toast("Lead saved"); }} />}</Modal>
    <Modal open={gen} onClose={() => setGen(false)} title="AI lead finder — define your ICP" wide>
      <div className="grid gap-3 md:grid-cols-2"><Field label="City / region"><input className="inp" value={icp.city} onChange={(e) => setIcp({ ...icp, city: e.target.value })} placeholder={w.vendors.find((v) => v.id === vid)?.city} /></Field>
        <Field label="Segments (comma)"><input className="inp" value={icp.segments} onChange={(e) => setIcp({ ...icp, segments: e.target.value })} placeholder="Event planners, hotels, schools" /></Field>
        <Field label="Customer types"><div className="flex flex-wrap gap-1">{TYPES.map((t) => <button key={t} onClick={() => setIcp({ ...icp, customerTypes: icp.customerTypes.includes(t) ? icp.customerTypes.filter((x) => x !== t) : [...icp.customerTypes, t] })} className={`chip ${icp.customerTypes.includes(t) ? "chip-on" : ""}`}>{t}</button>)}</div></Field>
        <Field label="Products to sell"><div className="flex flex-wrap gap-1">{w.products.filter((p) => p.vendorId === vid).map((p) => <button key={p.id} onClick={() => setIcp({ ...icp, productIds: icp.productIds.includes(p.id) ? icp.productIds.filter((x) => x !== p.id) : [...icp.productIds, p.id] })} className={`chip ${icp.productIds.includes(p.id) ? "chip-on" : ""}`}>{p.name}</button>)}</div></Field>
        <Field label="Extra notes"><input className="inp" value={icp.notes} onChange={(e) => setIcp({ ...icp, notes: e.target.value })} /></Field></div>
      <button disabled={busy} className="btn mt-3" onClick={async () => { setBusy(true); const j = await api("/api/ai", { task: "leadgen", vendorId: vid, icp: { ...icp, segments: icp.segments.split(",").map((s) => s.trim()).filter(Boolean) } }); setFound(j.leads ?? []); setBusy(false); if (!j.leads?.length) toast("AI returned no prospects — check AI keys or refine ICP"); }}>{busy ? <Dots /> : "Generate prospects"}</button>
      {found.length > 0 && <div className="mt-4 space-y-2">{found.map((l) => <div key={l.id} className="rounded-xl bg-white/5 p-2 text-sm"><b>{l.name}</b> · {l.company} <span className="chip">{l.customerType}</span><div className="text-xs text-white/50">{l.note}</div></div>)}
        <p className="text-xs text-amber-200/80">AI prospects are research profiles — verify contact details before outreach.</p>
        <button className="btn" onClick={async () => { await saveMany("leads", found); setFound([]); setGen(false); toast(`${found.length} leads added`); }}>Add {found.length} to leads</button></div>}</Modal></div>;
}
function LeadForm({ l, set, onSave }: { l: Lead; set: (l: Lead) => void; onSave: () => void }) {
  const { w } = useData(); if (!w) return null; const u = (p: Partial<Lead>) => set({ ...l, ...p });
  return <div className="grid gap-3 md:grid-cols-3">
    {(["name", "company", "email", "phone", "segment", "source"] as const).map((k) => <Field key={k} label={k}><input className="inp" value={l[k]} onChange={(e) => u({ [k]: e.target.value })} /></Field>)}
    <Field label="Vendor"><select className="inp" value={l.vendorId} onChange={(e) => u({ vendorId: e.target.value })}>{w.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
    <Field label="Customer type"><select className="inp" value={l.customerType} onChange={(e) => u({ customerType: e.target.value as Lead["customerType"] })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Channel"><select className="inp" value={l.channel} onChange={(e) => u({ channel: e.target.value as Lead["channel"] })}>{["whatsapp", "messenger", "instagram", "email", "sms", "voice", "web"].map((t) => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Stage"><select className="inp" value={l.stage} onChange={(e) => u({ stage: e.target.value as Stage })}>{STAGES.map((t) => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Value"><input type="number" className="inp" value={l.value} onChange={(e) => u({ value: +e.target.value })} /></Field>
    <Field label="Campaign"><select className="inp" value={l.campaignId ?? ""} onChange={(e) => u({ campaignId: e.target.value || undefined })}><option value="">—</option>{w.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <div className="md:col-span-3"><Field label="Products / services of interest"><div className="flex flex-wrap gap-1">{w.products.filter((p) => p.vendorId === l.vendorId).map((p) => <button key={p.id} onClick={() => u({ productIds: l.productIds.includes(p.id) ? l.productIds.filter((x) => x !== p.id) : [...l.productIds, p.id] })} className={`chip ${l.productIds.includes(p.id) ? "chip-on" : ""}`}>{p.kind === "service" ? "🛠" : "📦"} {p.name}</button>)}</div></Field></div>
    <div className="md:col-span-3"><Field label="Notes"><textarea className="inp" rows={3} value={l.note} onChange={(e) => u({ note: e.target.value })} /></Field></div>
    <Field label="Tags (comma)"><input className="inp" value={l.tags.join(", ")} onChange={(e) => u({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
    <div className="flex items-end md:col-span-2"><button className="btn ml-auto" disabled={!l.name} onClick={onSave}>Save lead</button></div></div>;
}
