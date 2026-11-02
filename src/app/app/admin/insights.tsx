"use client";
// Futuristic analytics (pure SVG, no chart lib) + AI next-task insights + full audit log.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useData } from "@/lib/client/data";
import { Card, Stat, money, toast, Dots } from "@/components/ui";
import type { Workspace } from "@/lib/schema";
type Ins = { level: "urgent" | "high" | "info"; title: string; detail: string; href?: string; vendorId?: string };
const NEON = ["#39ff88", "#22d3ee", "#ff3ea5", "#ffb547", "#7c5cff", "#f87171", "#a3e635", "#38bdf8"];
function Donut({ data, label }: { data: { k: string; v: number }[]; label: string }) {
  const tot = data.reduce((a, d) => a + d.v, 0) || 1; let acc = 0; const R = 42, C = 2 * Math.PI * R;
  return <div className="flex items-center gap-4"><svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90"><circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="14" />
    {data.map((d, i) => { const len = (d.v / tot) * C; const el = <motion.circle key={d.k} cx="60" cy="60" r={R} fill="none" stroke={NEON[i % NEON.length]} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .08 }} style={{ filter: `drop-shadow(0 0 4px ${NEON[i % NEON.length]})` }} />; acc += len; return el; })}
    <text x="60" y="-56" transform="rotate(90)" textAnchor="middle" className="fill-white text-[13px] font-bold">{tot === 1 && !data.some((d) => d.v) ? 0 : tot}</text><text x="60" y="-42" transform="rotate(90)" textAnchor="middle" className="fill-white/40 text-[7px] uppercase">{label}</text></svg>
    <div className="space-y-1 text-xs">{data.map((d, i) => <div key={d.k} className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: NEON[i % NEON.length], boxShadow: `0 0 6px ${NEON[i % NEON.length]}` }} /><span className="capitalize text-white/70">{d.k}</span><b className="ml-auto pl-3">{d.v}</b></div>)}</div></div>;
}
function Bars({ v, labels, color = "#22d3ee", hi }: { v: number[]; labels?: string[]; color?: string; hi?: number }) { const m = Math.max(1, ...v);
  return <div><div className="flex h-32 items-end gap-[3px]">{v.map((x, i) => <motion.div key={i} title={`${labels?.[i] ?? i}: ${x}`} initial={{ height: 0 }} animate={{ height: `${(x / m) * 100}%` }} transition={{ delay: i * .015 }} className="flex-1 rounded-t" style={{ background: i === hi ? "#ff3ea5" : color, boxShadow: `0 0 8px -2px ${i === hi ? "#ff3ea5" : color}`, minHeight: 2 }} />)}</div>
    {labels && <div className="mt-1 flex justify-between text-[9px] text-white/35">{labels.filter((_, i) => i % Math.ceil(labels.length / 8) === 0).map((l) => <span key={l}>{l}</span>)}</div>}</div>; }
function Line({ pts, color = "#39ff88" }: { pts: number[]; color?: string }) { const m = Math.max(1, ...pts), W = 300, H = 90; const d = pts.map((p, i) => `${i ? "L" : "M"}${(i / Math.max(1, pts.length - 1)) * W},${H - (p / m) * (H - 8) - 4}`).join(" ");
  return <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" preserveAspectRatio="none"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#lg)" /><motion.path d={d} fill="none" stroke={color} strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} style={{ filter: `drop-shadow(0 0 4px ${color})` }} /></svg>; }
const days = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.now() - (n - 1 - i) * 864e5); return d.toISOString().slice(0, 10); });
export function Analytics() {
  const { w, vendor, set } = useData(); const [data, setData] = useState<{ insights: Ins[]; hours: number[]; products: { id: string; name: string; interested: number; buyers: number; conv: number; revenue: number; currency: string }[] } | null>(null); const [busy, setBusy] = useState("");
  useEffect(() => { fetch(`/api/insights?vendor=${vendor}`).then((r) => r.json()).then(setData).catch(() => {}); }, [vendor, w?.updatedAt]);
  const m = useMemo(() => { if (!w) return null; const inV = (x: { vendorId: string }) => vendor === "all" || x.vendorId === vendor; const leads = w.leads.filter(inV); const paid = w.payments.filter(inV).filter((p) => p.status === "paid");
    const d = days(14); const rev = d.map((k) => paid.filter((p) => p.at.slice(0, 10) === k).reduce((a, p) => a + (p.currency === "USD" ? p.amount * 1500 : p.amount), 0));
    const msgs = d.map((k) => w.conversations.filter(inV).reduce((a, c) => a + c.messages.filter((x) => x.at.slice(0, 10) === k).length, 0));
    const stage = ["new", "contacted", "qualified", "proposal", "won", "paid", "nurture", "lost"].map((k) => ({ k, v: leads.filter((l) => l.stage === k).length }));
    const ch = ["whatsapp", "messenger", "instagram", "email", "voice", "web"].map((k) => ({ k, v: w.conversations.filter(inV).filter((c) => c.channel === k).length + leads.filter((l) => l.channel === k).length })).filter((x) => x.v);
    const ai = w.audit.filter((a) => /ai|autopilot|cron|publisher|system/i.test(a.actor)).length; const conv = Math.round(100 * leads.filter((l) => ["won", "paid", "nurture"].includes(l.stage)).length / Math.max(1, leads.length));
    const delivered = w.conversations.filter(inV).flatMap((c) => c.messages.filter((x) => x.from !== "customer" && x.status)); const read = delivered.filter((x) => x.status === "read").length;
    return { leads, paid, d, rev, msgs, stage, ch, ai, conv, readRate: delivered.length ? Math.round(100 * read / delivered.length) : 0 }; }, [w, vendor]);
  if (!w || !m) return null; const hours = data?.hours ?? Array(24).fill(0); const peak = hours.indexOf(Math.max(...hours));
  const propose = async (vendorId: string) => { setBusy(vendorId); const j = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId }) }).then((r) => r.json()); set({ approvals: j.approvals, posts: j.posts }); setBusy(""); toast("Campaign proposal queued — approve or edit it in Autopilot"); };
  const tone = { urgent: "border-red-400/50 bg-red-500/10 text-red-200", high: "border-amber-400/40 bg-amber-400/10 text-amber-100", info: "border-[#22d3ee]/30 bg-[#22d3ee]/5 text-[#c9f6ff]" };
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6"><Stat label="Leads" value={m.leads.length} /><Stat label="Conversion" value={`${m.conv}%`} /><Stat label="Revenue (₦-eq)" value={money(m.paid.reduce((a, p) => a + (p.currency === "USD" ? p.amount * 1500 : p.amount), 0))} /><Stat label="Read rate" value={`${m.readRate}%`} tip="Outbound messages marked read by WhatsApp/Messenger/IG receipts" /><Stat label="AI actions" value={m.ai} /><Stat label="Peak hour" value={`${String(peak).padStart(2, "0")}:00`} tip="Busiest customer hour in vendor local time" /></div>
    <Card title="⚡ What to do next" right={<div className="flex flex-wrap gap-1">{w.vendors.filter((v) => vendor === "all" || v.id === vendor).map((v) => <button key={v.id} disabled={!!busy} onClick={() => propose(v.id)} className="chip hover:chip-on">{busy === v.id ? <Dots /> : `✦ Propose campaign · ${v.name}`}</button>)}</div>}>
      <div className="grid gap-2 md:grid-cols-2">{(data?.insights ?? []).map((x, i) => <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * .04 } }} className={`rounded-xl border p-3 text-sm ${tone[x.level]}`}><div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider">{x.level}</span><b className="flex-1">{x.title}</b>{x.href && <Link href={x.href} className="text-xs underline">Act →</Link>}</div><p className="mt-1 text-xs opacity-80">{x.detail}</p></motion.div>)}
        {!data && <Dots />}</div></Card>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Pipeline mix"><Donut data={m.stage.filter((s) => s.v)} label="leads" /></Card>
      <Card title="Channel mix"><Donut data={m.ch} label="touchpoints" /></Card>
      <Card title={`Audience activity by hour · peak ${String(peak).padStart(2, "0")}:00`}><Bars v={hours} hi={peak} labels={hours.map((_, i) => `${i}h`)} /></Card></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Revenue · last 14 days"><Line pts={m.rev} /><div className="flex justify-between text-[9px] text-white/35"><span>{m.d[0]}</span><span>{m.d.at(-1)}</span></div></Card>
      <Card title="Message volume · last 14 days"><Bars v={m.msgs} color="#7c5cff" labels={m.d.map((x) => x.slice(5))} /></Card></div>
    <Card title="Product performance (replicate the winners)"><div className="space-y-1.5">{(data?.products ?? []).sort((a, b) => b.conv - a.conv || b.interested - a.interested).slice(0, 10).map((p, i) => <div key={p.id} className="flex items-center gap-2 text-xs"><span className="w-44 truncate text-white/70">{i === 0 && p.conv > 0 ? "🏆 " : ""}{p.name}</span><div className="h-3 flex-1 rounded bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, p.conv * 100)}%` }} className="h-full rounded bg-gradient-to-r from-[#39ff88] to-[#22d3ee]" /></div><span className="w-28 text-right text-white/50">{p.buyers}/{p.interested} · {Math.round(p.conv * 100)}%</span></div>)}</div></Card>
    <ByVendor w={w} /></div>;
}
function ByVendor({ w }: { w: Workspace }) { const paid = w.payments.filter((p) => p.status === "paid");
  return <Card title="By vendor"><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{w.vendors.map((v) => { const l = w.leads.filter((x) => x.vendorId === v.id); return <div key={v.id} className="rounded-xl border border-white/10 p-3" style={{ boxShadow: `inset 0 0 24px -16px ${v.color}` }}><div className="flex items-center gap-2 text-sm font-semibold"><i className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />{v.name}</div>
    <div className="mt-1 grid grid-cols-3 text-center text-[11px] text-white/50"><div><b className="block text-base text-white">{l.length}</b>leads</div><div><b className="block text-base text-white">{w.conversations.filter((c) => c.vendorId === v.id).length}</b>chats</div><div><b className="block text-base text-[#39ff88]">{money(paid.filter((p) => p.vendorId === v.id).reduce((a, p) => a + p.amount, 0), v.currency)}</b>paid</div></div></div>; })}</div></Card>; }
export function AuditLog() {
  const { w } = useData(); const [q, setQ] = useState(""); const [who, setWho] = useState("all"); if (!w) return null;
  const isAI = (a: string) => /^(ai|autopilot|cron|publisher|system|agent|webhook)/i.test(a);
  const rows = w.audit.filter((a) => (who === "all" || (who === "ai" ? isAI(a.actor) : !isAI(a.actor))) && (!q || `${a.actor} ${a.action} ${a.detail}`.toLowerCase().includes(q.toLowerCase())));
  const csv = () => { const b = new Blob(["at,actor,type,action,detail\n" + rows.map((a) => [a.at, a.actor, isAI(a.actor) ? "AI" : "manual", a.action, `"${(a.detail ?? "").replace(/"/g, '""')}"`].join(",")).join("\n")], { type: "text/csv" }); const u = document.createElement("a"); u.href = URL.createObjectURL(b); u.download = "salescrew-audit.csv"; u.click(); };
  return <Card title={`Audit log · ${rows.length} of ${w.audit.length}`} right={<div className="flex gap-1"><input className="inp !w-44 !py-1 text-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />{["all", "ai", "manual"].map((k) => <button key={k} onClick={() => setWho(k)} className={`chip ${who === k ? "chip-on" : ""}`}>{k === "ai" ? "AI / system" : k}</button>)}<button className="chip" onClick={csv}>⬇ CSV</button></div>}>
    <div className="max-h-[65vh] overflow-auto scroll-thin"><table className="w-full text-sm"><thead className="sticky top-0 bg-[#07100c]"><tr className="text-left text-white/45"><th className="py-1 pr-3">Timestamp (local)</th><th className="pr-3">Actor</th><th className="pr-3">Action</th><th>Detail</th></tr></thead>
      <tbody>{rows.map((a) => <tr key={a.id} className="border-t border-white/5 align-top"><td className="whitespace-nowrap py-1.5 pr-3 font-mono text-[11px] text-white/60">{new Date(a.at).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}</td>
        <td className="pr-3"><span className={`chip !py-0 text-[10px] ${isAI(a.actor) ? "border-[#22d3ee]/40 text-[#a5f3fc]" : "chip-on"}`}>{isAI(a.actor) ? "🤖" : "👤"} {a.actor}</span></td><td className="pr-3"><code className="text-xs text-[#39ff88]">{a.action}</code></td><td className="text-xs text-white/70">{a.detail}</td></tr>)}</tbody></table></div></Card>;
}
