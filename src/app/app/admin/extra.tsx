"use client";
// Admin power tabs: AI copilot (natural-language ops), Autopilot + approvals, vendor knowledge base, unique vendor channels, bank accounts.
import { useRef, useState } from "react";
import Link from "next/link";
import { useData } from "@/lib/client/data";
import { Card, Dots, Field, Tip, Toggle, toast, ago, Chevron } from "@/components/ui";
import { Icon } from "@/components/icons/Futur";
import { ChannelIcon } from "@/components/icons/ChannelIcons";
import type { Approval, BankAccount, Task, Vendor } from "@/lib/schema";
const md = (s: string) => s.split("\n").map((l, i) => <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^[-•] /, "• ") }} />);
const EX = ["Who should I follow up today, and draft the messages", "Remind everyone with unpaid payment links", "Which products get views but no buyers? Suggest fixes", "Every Monday, DM people who commented on our posts", "Move hot leads with score above 80 to proposal"];
export function Copilot() {
  const { w, set } = useData(); const [q, setQ] = useState(""); const [busy, setBusy] = useState(false); const [hist, setHist] = useState<{ q: string; a: string; s?: string[]; queued?: string[] }[]>([]);
  if (!w) return null;
  const ask = async (p = q) => { if (!p.trim()) return; setBusy(true); setQ(""); const r = await fetch("/api/admin-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: p }) }).then((r) => r.json());
    set({ approvals: r.approvals, tasks: r.tasks }); setHist([{ q: p, a: r.answer, s: r.suggestions, queued: r.queued }, ...hist]); setBusy(false); };
  return <div className="grid gap-4 lg:grid-cols-[1fr_340px]"><Card title={<span className="flex items-center gap-2"><Icon name="spark" size={16} /> Ask your business anything</span>}>
    <div className="flex gap-2"><input className="inp flex-1" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="e.g. Follow up everyone who asked about small chops this week" />
      <button className="btn" disabled={busy} onClick={() => ask()}>{busy ? <Dots /> : <Icon name="send" size={16} />}</button></div>
    <div className="mt-2 flex gap-1 overflow-x-auto scroll-thin pb-1">{EX.map((e) => <button key={e} onClick={() => ask(e)} className="chip shrink-0 hover:chip-on">{e}</button>)}</div>
    <div className="mt-4 space-y-3">{busy && <div className="skel h-20" />}{hist.map((h, i) => <div key={i} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm"><div className="mb-2 text-white/50">› {h.q}</div><div>{md(h.a)}</div>
      {!!h.s?.length && <div className="mt-2 flex flex-wrap gap-1">{h.s.map((s) => <button key={s} onClick={() => ask(s)} className="chip">💡 {s}</button>)}</div>}
      {!!h.queued?.length && <div className="mt-2 text-xs text-[#39ff88]">{h.queued.length} action(s) queued for your approval → see Autopilot</div>}</div>)}
      {!hist.length && !busy && <p className="text-sm text-white/40">The copilot reads leads, payments, products, engagements and chats; it answers, suggests, and queues actions (messages, stage changes, recurring tasks) for one-click approval.</p>}</div></Card>
    <Approvals compact /></div>;
}
export function Approvals({ compact }: { compact?: boolean }) {
  const { w, set } = useData(); const [busy, setBusy] = useState(""); const [edit, setEdit] = useState<Record<string, string>>({}); if (!w) return null;
  const pend = (w.approvals ?? []).filter((a) => a.status === "pending"); const done = (w.approvals ?? []).filter((a) => a.status !== "pending").slice(0, 8);
  const go = async (action: string, ids: string[], text?: string) => { setBusy(ids.join()); const r = await fetch("/api/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids, text }) }).then((r) => r.json()); set({ approvals: r.approvals, tasks: r.tasks }); setBusy(""); toast(action === "approve" ? "Approved & executed" : "Rejected"); };
  return <Card title={`Waiting for you · ${pend.length}`} right={pend.length > 1 && <button className="btn !py-1 text-xs" onClick={() => go("approve", pend.map((a) => a.id))}>Approve all</button>}>
    <div className={`space-y-2 ${compact ? "max-h-[60vh] overflow-y-auto scroll-thin" : ""}`}>{pend.map((a: Approval) => <div key={a.id} className="rounded-xl border border-[#39ff88]/20 bg-[#39ff88]/[.04] p-2.5 text-sm"><div className="flex items-center gap-2"><b className="flex-1">{a.title}</b><span className="text-[10px] text-white/40">{ago(a.at)}</span></div>
      {a.action.type === "message" ? <textarea className="inp mt-1 !text-xs" rows={2} value={edit[a.id] ?? a.detail} onChange={(e) => setEdit({ ...edit, [a.id]: e.target.value })} /> : <p className="mt-1 whitespace-pre-line text-xs text-white/60">{a.detail}</p>}
      <div className="mt-2 flex gap-2"><button className="btn !py-1 text-xs" disabled={!!busy} onClick={() => go("approve", [a.id], edit[a.id])}>{busy === a.id ? <Dots /> : <><Icon name="check" size={12} /> Approve</>}</button><button className="btn-ghost !py-1 text-xs" disabled={!!busy} onClick={() => go("reject", [a.id])}>Reject</button></div></div>)}
      {!pend.length && <p className="text-sm text-white/40">Nothing waiting. Autopilot tasks that need approval land here.</p>}
      {!compact && done.length > 0 && <div className="pt-2"><div className="label mb-1">Recent</div>{done.map((a) => <div key={a.id} className="flex gap-2 text-xs text-white/50"><span className={a.status === "rejected" ? "text-red-300" : "text-[#39ff88]"}>{a.status}</span><span className="truncate">{a.title}</span></div>)}</div>}</div></Card>;
}
export function Autopilot() {
  const { w, set } = useData(); const [busy, setBusy] = useState(""); const [nt, setNt] = useState({ name: "", prompt: "", schedule: "daily" }); if (!w) return null;
  const go = async (b: object, k: string) => { setBusy(k); const r = await fetch("/api/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()); set({ approvals: r.approvals, tasks: r.tasks }); setBusy(""); if (Array.isArray(r.result)) toast(r.result.join(" · ") || "Nothing due"); };
  return <div className="grid gap-4 lg:grid-cols-[1fr_380px]"><Card title="Scheduled tasks" right={<Tip text="Run every enabled task now, regardless of schedule"><button className="btn !py-1 text-xs" disabled={!!busy} onClick={() => go({ action: "runAll" }, "all")}>{busy === "all" ? <Dots /> : "Run all now"}</button></Tip>}>
    <p className="mb-3 text-xs text-white/45">Vercel cron runs due tasks daily at 08:00 WAT (Hobby plan). Turn on “Needs approval” to keep a human in the loop — the AI drafts, you approve.</p>
    <div className="space-y-2">{(w.tasks ?? []).map((t: Task) => <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 p-2.5 text-sm"><Toggle on={t.enabled} onChange={(on) => go({ action: "toggle", taskId: t.id, patch: { enabled: on } }, t.id)} />
      <div className="min-w-[180px] flex-1"><b>{t.name}</b><div className="text-[11px] text-white/45">{t.lastRun ? `last ${ago(t.lastRun)} ago · ${t.lastResult}` : "never run"}{t.prompt ? ` · “${t.prompt.slice(0, 60)}”` : ""}</div></div>
      <select className="inp !w-auto !py-1 text-xs" value={t.schedule} onChange={(e) => go({ action: "toggle", taskId: t.id, patch: { schedule: e.target.value } }, t.id)}><option>hourly</option><option>daily</option><option>weekly</option></select>
      <Tip text="When on, actions wait in Approvals instead of executing"><label className="flex items-center gap-1 text-xs"><input type="checkbox" className="ck" checked={t.approval} onChange={(e) => go({ action: "toggle", taskId: t.id, patch: { approval: e.target.checked } }, t.id)} />Needs approval</label></Tip>
      <button className="btn-ghost !py-1 text-xs" disabled={!!busy} onClick={() => go({ action: "run", taskId: t.id }, t.id)}>{busy === t.id ? <Dots /> : "Run now"}</button>{t.kind === "custom" && <button className="text-xs text-red-300/70" onClick={() => go({ action: "deleteTask", taskId: t.id }, t.id)}>✕</button>}</div>)}</div>
    <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-white/15 p-3 md:grid-cols-[1fr_2fr_auto_auto]"><input className="inp" placeholder="Task name" value={nt.name} onChange={(e) => setNt({ ...nt, name: e.target.value })} /><input className="inp" placeholder="What should the AI do? e.g. find leads who viewed jollof trays and suggest a promo" value={nt.prompt} onChange={(e) => setNt({ ...nt, prompt: e.target.value })} />
      <select className="inp" value={nt.schedule} onChange={(e) => setNt({ ...nt, schedule: e.target.value })}><option>hourly</option><option>daily</option><option>weekly</option></select><button className="btn" disabled={!nt.name} onClick={() => { go({ action: "addTask", ...nt }, "add"); setNt({ name: "", prompt: "", schedule: "daily" }); }}>Add</button></div></Card>
    <Approvals /></div>;
}
const pickV = (w: { vendors: Vendor[] }, vendor: string) => (vendor === "all" ? w.vendors[0] : w.vendors.find((v) => v.id === vendor) ?? w.vendors[0]);
export function Knowledge() {
  const { w, vendor, set } = useData(); const [vid, setVid] = useState(""); const [txt, setTxt] = useState(""); const [busy, setBusy] = useState(false); const [rep, setRep] = useState<{ name: string; chars: number; via: string }[]>([]); const fr = useRef<HTMLInputElement>(null); const [view, setView] = useState(false);
  if (!w) return null; const v = w.vendors.find((x) => x.id === vid) ?? pickV(w, vendor);
  const send = async (files?: FileList | null) => { setBusy(true); const f = new FormData(); f.append("vendorId", v.id); if (txt) f.append("text", txt); Array.from(files ?? []).forEach((x) => f.append("file", x)); const r = await fetch("/api/knowledge", { method: "POST", body: f }).then((r) => r.json()); set({ vendors: r.vendors }); setRep(r.report ?? []); setTxt(""); setBusy(false); toast("Knowledge updated — the AI uses it in every reply"); };
  const rm = async (name: string) => { const r = await fetch(`/api/knowledge?vendorId=${v.id}&name=${encodeURIComponent(name)}`, { method: "DELETE" }).then((r) => r.json()); set({ vendors: r.vendors }); };
  return <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><Card title="Teach the AI about this vendor" right={<select className="inp !w-auto !py-1 text-xs" value={v.id} onChange={(e) => setVid(e.target.value)}>{w.vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}>
    <Field label="Type or paste (prices, delivery areas, FAQs, policies, tone)"><textarea className="inp" rows={6} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Delivery: Port Harcourt GRA ₦2,000, Woji ₦2,500\nSmall chops tray (50 pcs) ₦35,000 — order 48h ahead\nWe don't do refunds after baking starts"} /></Field>
    <div className="mt-2 flex flex-wrap items-center gap-2"><button className="btn" disabled={busy || !txt.trim()} onClick={() => send()}>{busy ? <Dots /> : "Save text"}</button>
      <input ref={fr} type="file" hidden multiple accept="image/*,.pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => send(e.target.files)} />
      <Tip text="Photos of menus/price lists (AI vision), PDF, Word .docx, TXT/CSV — up to 15MB each"><button className="btn-ghost" disabled={busy} onClick={() => fr.current?.click()}><Icon name="clip" size={14} /> Upload photo / PDF / Word</button></Tip>
      <span className="text-xs text-white/40">{(v.knowledge ?? "").length.toLocaleString()} chars in knowledge base</span></div>
    {rep.length > 0 && <div className="mt-3 space-y-1 text-xs">{rep.map((r) => <div key={r.name} className={r.chars ? "text-[#39ff88]" : "text-amber-300"}>{r.chars ? "✓" : "!"} {r.name} — {r.chars.toLocaleString()} chars via {r.via}</div>)}</div>}
    <button className="mt-3 text-xs text-white/50 underline" onClick={() => setView(!view)}>{view ? "Hide" : "View / edit"} full knowledge base</button>
    {view && <KbEdit v={v} />}</Card>
    <Card title="Sources"><div className="space-y-1 text-sm">{(v.docs ?? []).map((d) => <div key={d.name + d.at} className="flex items-center gap-2 border-b border-white/5 py-1.5"><Icon name="doc" size={14} /><span className="flex-1 truncate">{d.url ? <a href={d.url} target="_blank" className="underline">{d.name}</a> : d.name}</span><span className="text-[10px] text-white/40">{d.chars.toLocaleString()}</span><button className="text-xs text-red-300/70" onClick={() => rm(d.name)}>✕</button></div>)}
      {!v.docs?.length && <p className="text-white/40">No sources yet.</p>}</div></Card></div>;
}
function KbEdit({ v }: { v: Vendor }) { const { set } = useData(); const [k, setK] = useState(v.knowledge ?? "");
  return <div className="mt-2"><textarea className="inp font-mono !text-xs" rows={12} value={k} onChange={(e) => setK(e.target.value)} /><button className="btn mt-2" onClick={async () => { const r = await fetch("/api/knowledge", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: v.id, knowledge: k }) }).then((r) => r.json()); set({ vendors: r.vendors }); toast("Saved"); }}>Save edits</button></div>; }
export function Channels() {
  const { w, set } = useData(); const [f, setF] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(""); if (!w) return null;
  const save = async (v: Vendor, channel: string) => { const id = f[`${v.id}.${channel}.id`]; if (!id) return; setBusy(v.id + channel); const r = await fetch("/api/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "manual", vendorId: v.id, channel, id, display: f[`${v.id}.${channel}.d`] || undefined }) }); const j = await r.json(); setBusy("");
    if (!r.ok) return toast(j.error ?? "Failed"); set({ vendors: j.vendors }); toast("Mapped — inbound messages on this id route to this vendor"); };
  const ids = (v: Vendor) => ({ whatsapp: [v.channels.whatsapp?.phoneNumberId, v.channels.whatsapp?.display], messenger: [v.channels.messenger?.pageId, v.channels.messenger?.pageName], instagram: [v.channels.instagram?.igUserId, v.channels.instagram?.handle] });
  const all = w.vendors.flatMap((v) => Object.values(ids(v)).map(([id]) => id).filter(Boolean)); const dup = new Set(all.filter((x, i) => all.indexOf(x) !== i));
  return <Card title="One WhatsApp number, Page and Instagram account per vendor" right={<Link href="/app/settings" className="btn-ghost !py-1 text-xs">Tokens & OAuth in Settings <Chevron /></Link>}>
    <p className="mb-3 text-xs text-white/45">Inbound messages route by the id they arrive on, so each id can belong to one vendor only (duplicates are rejected).</p>
    <div className="space-y-3">{w.vendors.map((v) => <div key={v.id} className="rounded-xl border border-white/10 p-3"><div className="mb-2 flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} /><b>{v.name}</b></div>
      <div className="grid gap-2 md:grid-cols-3">{(Object.entries(ids(v)) as [string, (string | undefined)[]][]).map(([c, [id, disp]]) => <div key={c} className="rounded-lg bg-white/[.03] p-2 text-xs"><div className="mb-1 flex items-center gap-1.5"><ChannelIcon ch={c} size={14} /><b className="capitalize">{c}</b>{id ? <span className={`chip ml-auto ${dup.has(id) ? "text-red-300" : "chip-on"}`}>{dup.has(id) ? "duplicate!" : "mapped"}</span> : <span className="chip ml-auto">not set</span>}</div>
        <div className="mb-1 truncate text-white/50">{disp ?? "—"} {id && <code className="text-white/30">· {id}</code>}</div>
        <div className="flex gap-1"><input className="inp !py-1 !text-xs" placeholder={c === "whatsapp" ? "Phone number ID" : c === "messenger" ? "Page ID" : "IG user ID"} value={f[`${v.id}.${c}.id`] ?? ""} onChange={(e) => setF({ ...f, [`${v.id}.${c}.id`]: e.target.value })} />
          <input className="inp !py-1 !text-xs" placeholder={c === "whatsapp" ? "+234…" : c === "messenger" ? "Page name" : "@handle"} value={f[`${v.id}.${c}.d`] ?? ""} onChange={(e) => setF({ ...f, [`${v.id}.${c}.d`]: e.target.value })} />
          <button className="btn !px-2 !py-1 text-xs" disabled={busy === v.id + c} onClick={() => save(v, c)}>{busy === v.id + c ? <Dots /> : "Map"}</button></div></div>)}</div></div>)}</div></Card>;
}
export function Banks() {
  const { w, save } = useData(); const [vid, setVid] = useState(""); const [b, setB] = useState<BankAccount>({ bank: "", accountName: "", accountNumber: "", currency: "NGN" }); if (!w) return null;
  const v = w.vendors.find((x) => x.id === vid) ?? w.vendors[0]; const list = v.bank ?? [];
  const put = async (bank: BankAccount[]) => { await save("vendors", { ...v, bank }); toast("Bank details saved — shown on transfer payment pages & to the AI"); };
  return <Card title={<span className="flex items-center gap-2"><Icon name="bank" size={16} /> Bank accounts for transfer / cash payments</span>} right={<select className="inp !w-auto !py-1 text-xs" value={v.id} onChange={(e) => setVid(e.target.value)}>{w.vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}>
    <div className="grid gap-2 md:grid-cols-2">{list.map((a, i) => <div key={i} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm"><div className="flex"><b className="flex-1">{a.bank}</b><button className="text-xs text-red-300/70" onClick={() => put(list.filter((_, j) => j !== i))}>Remove</button></div><div>{a.accountName}</div><div className="neon font-mono text-lg">{a.accountNumber}</div><div className="text-xs text-white/45">{a.currency}{a.note ? ` · ${a.note}` : ""}</div></div>)}
      {!list.length && <p className="text-sm text-white/40">No accounts yet.</p>}</div>
    <div className="mt-3 grid gap-2 md:grid-cols-5"><input className="inp" placeholder="Bank (e.g. GTBank)" value={b.bank} onChange={(e) => setB({ ...b, bank: e.target.value })} /><input className="inp" placeholder="Account name" value={b.accountName} onChange={(e) => setB({ ...b, accountName: e.target.value })} />
      <input className="inp font-mono" placeholder="0123456789" inputMode="numeric" value={b.accountNumber} onChange={(e) => setB({ ...b, accountNumber: e.target.value.replace(/[^\d]/g, "").slice(0, 18) })} /><select className="inp" value={b.currency} onChange={(e) => setB({ ...b, currency: e.target.value as "NGN" })}><option>NGN</option><option>USD</option></select>
      <button className="btn" disabled={!b.bank || b.accountNumber.length < 6} onClick={async () => { await put([...list, b]); setB({ bank: "", accountName: "", accountNumber: "", currency: "NGN" }); }}>Add account</button></div></Card>;
}
