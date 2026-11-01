"use client";
import { useState } from "react";
import Link from "next/link";
import { useData, inVendor } from "@/lib/client/data";
import { Card, Chevron, Dots, PageHead, Tip, toast, ago, Skel } from "@/components/ui";
import { uid, type Memory } from "@/lib/schema";
type Act = { leadId?: string; title: string; why: string; channel: string; urgency: string; play: string };
export default function Mem() {
  const { w, vendor, api, save, del } = useData(); const [nba, setNba] = useState<{ summary: string; actions: Act[] } | null>(null); const [busy, setBusy] = useState(false); const [scope, setScope] = useState<"all" | "short" | "long">("all"); const [q, setQ] = useState(""); const [txt, setTxt] = useState("");
  if (!w) return null; const mem = w.memory.filter(inVendor(vendor)).filter((m) => scope === "all" || m.scope === scope).filter((m) => !q || m.text.toLowerCase().includes(q.toLowerCase()));
  const run = async () => { setBusy(true); setNba(await api("/api/ai", { task: "nba" })); setBusy(false); };
  const link = (a: Act) => a.play === "close" || a.channel === "voice" ? `/app/calls?lead=${a.leadId}` : `/app/outreach?leads=${a.leadId}`;
  return <div><PageHead title="Memory & Next Best Action" sub="Short-term memory (72h promises/objections) and long-term memory (preferences, purchases) power every AI reply. NBA ranks what to do next for revenue." right={<button className="btn" onClick={run} disabled={busy}>{busy ? <Dots /> : <>Get next best actions <Chevron /></>}</button>} />
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"><Card title="Next best actions">{busy ? <div className="space-y-2"><Skel className="h-12" /><Skel className="h-12" /><Skel className="h-12" /></div> : nba ? <div className="space-y-2"><p className="text-sm text-white/70">{nba.summary}</p>
      {nba.actions.map((a, i) => <Link key={i} href={link(a)} className="chev-host flex items-start gap-3 rounded-xl border border-white/5 bg-white/[.03] p-3 hover:border-[#39ff88]/40"><span className={`chip ${a.urgency === "high" ? "chip-on" : ""}`}>{a.urgency}</span><div className="flex-1"><b className="text-sm">{a.title}</b><div className="text-xs text-white/50">{a.why}</div><div className="mt-1 flex gap-1"><span className="chip">{a.play}</span><span className="chip">{a.channel}</span></div></div><Chevron /></Link>)}</div>
      : <p className="text-sm text-white/40">Click “Get next best actions” — the AI reads leads, memory and campaigns.</p>}</Card>
      <Card title="Memory bank" right={<div className="flex gap-1">{(["all", "short", "long"] as const).map((s) => <button key={s} onClick={() => setScope(s)} className={`chip ${scope === s ? "chip-on" : ""}`}>{s}</button>)}</div>}>
        <div className="mb-2 flex gap-2"><input className="inp" placeholder="Search memory" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="mb-3 flex gap-2"><input className="inp" placeholder="Add a long-term insight (e.g. Customers prefer delivery on Saturdays)" value={txt} onChange={(e) => setTxt(e.target.value)} /><button className="btn" onClick={async () => { if (!txt) return; const m: Memory = { id: uid("m"), vendorId: vendor === "all" ? w.vendors[0].id : vendor, scope: "long", kind: "insight", text: txt, at: new Date().toISOString() }; await save("memory", m); setTxt(""); toast("Saved"); }}>Add</button></div>
        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto scroll-thin">{mem.map((m) => <div key={m.id} className="group flex items-start gap-2 rounded-lg bg-white/[.03] p-2 text-sm"><Tip text={m.scope === "short" ? `Expires ${m.ttlHours ?? 72}h after creation` : "Kept long-term"}><span className={`chip ${m.scope === "long" ? "chip-on" : ""}`}>{m.scope}</span></Tip><div className="flex-1"><div>{m.text}</div><div className="text-[11px] text-white/40">{m.kind} · {w.leads.find((l) => l.id === m.leadId)?.name ?? "workspace"} · {ago(m.at)}</div></div><button className="text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-300" onClick={() => del("memory", [m.id])}>✕</button></div>)}{!mem.length && <p className="text-sm text-white/40">No memory yet.</p>}</div></Card></div></div>;
}
