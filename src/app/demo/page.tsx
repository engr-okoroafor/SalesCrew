"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Prov = "meta" | "nvidia";
type Lead = { id: string; name: string; company: string; source: string; email: string; phone: string; note: string; score: number };
type Msg = { from: "customer" | "agent"; text: string; meta?: string };
type Cap = { at: string; event: string; body: unknown };
const TABS = ["Inbox", "Leads", "Outreach", "Call lab", "Bookings", "CAPI", "Site builder", "Settings"] as const;
const SEED: Record<string, Msg[]> = {
  whatsapp: [{ from: "customer", text: "Good evening! Can I get a 6-inch birthday cake ready for Saturday? Chocolate please 🎂" }],
  messenger: [{ from: "customer", text: "Hi, do you deliver small chops to Woji? Need 50 pcs for Friday." }],
  instagram: [{ from: "customer", text: "Saw your red velvet post 😍 what's the price for a wedding cake, 3 tiers?" }],
};
const CH = { whatsapp: ["WhatsApp", "#25D366"], messenger: ["Messenger", "#0084FF"], instagram: ["Instagram DM", "#E1306C"] } as const;
async function post(url: string, body: unknown) { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json(); }
const Badge = ({ r }: { r: { provider?: string; model?: string; fallback?: boolean } }) => r?.model ? <span className="tip rounded-full border border-emerald-400/30 px-2 py-0.5 text-[10px] text-emerald-300" data-tip={r.fallback ? "Meta unavailable → NVIDIA fallback" : "Primary provider"}>{r.provider} · {r.model}{r.fallback ? " · fallback" : ""}</span> : null;

export default function Demo() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Inbox");
  const [prov, setProv] = useState<Prov>("meta");
  const [capi, setCapi] = useState<Cap[]>([]);
  const [bookings, setBookings] = useState<{ slots: string[]; bookings: { id: string; slot: string; who: string; channel: string }[] }>({ slots: [], bookings: [] });
  const refreshBookings = () => fetch("/api/booking").then((r) => r.json()).then(setBookings);
  useEffect(() => { refreshBookings(); }, []);
  const fire = async (event: string, extra: Record<string, unknown> = {}) => { const body = await post("/api/capi", { event, ...extra }); setCapi((c) => [{ at: new Date().toLocaleTimeString(), event, body }, ...c]); };
  return (
    <main className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 p-4">
        <Link href="/" className="text-xl font-black">Sales<span className="neon">Crew</span> <span className="text-sm font-normal text-slate-400">· Amaka&apos;s Oven & Events, Port Harcourt</span></Link>
        <span className="tip text-xs text-slate-400" data-tip="Change in Settings">AI: <b className="neon">{prov === "meta" ? "Meta Muse Spark → NVIDIA" : "NVIDIA → Meta"}</b></span>
      </header>
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm ${tab === t ? "btn" : "glass text-slate-300"}`}>{t}</button>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-4 pb-16">
          {tab === "Inbox" && <Inbox prov={prov} onBook={async (slot, ch) => { const r = await post("/api/booking", { slot, who: `${CH[ch as keyof typeof CH][0]} customer`, channel: ch }); if (r.ok) { refreshBookings(); fire("meeting_booked", { value: 25000, leadId: r.booking.id }); } }} />}
          {tab === "Leads" && <Leads />}
          {tab === "Outreach" && <Outreach prov={prov} />}
          {tab === "Call lab" && <CallLab prov={prov} />}
          {tab === "Bookings" && <Bookings data={bookings} refresh={refreshBookings} onWon={(id) => fire("job_won", { value: 180000, leadId: id })} />}
          {tab === "CAPI" && <Capi log={capi} fire={fire} />}
          {tab === "Site builder" && <Site prov={prov} />}
          {tab === "Settings" && <Settings prov={prov} setProv={setProv} />}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}

function Inbox({ prov, onBook }: { prov: Prov; onBook: (slot: string, ch: string) => void }) {
  const [threads, setThreads] = useState(SEED);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (ch: string, list: Msg[]) => {
    setBusy(ch); const r = await post("/api/assist", { channel: ch, history: list, provider: prov }); setBusy(null);
    const out: Msg[] = [...list, { from: "agent", text: r.text, meta: `${r.provider} · ${r.model}${r.handoff ? " · HANDOFF" : ""}${r.booked ? ` · BOOKED ${r.booked}` : ""}` }];
    setThreads((t) => ({ ...t, [ch]: out })); if (r.booked) onBook(r.booked, ch);
  };
  const send = (ch: string) => { const v = (draft[ch] ?? "").trim(); if (!v) return; const list = [...threads[ch], { from: "customer" as const, text: v }]; setThreads((t) => ({ ...t, [ch]: list })); setDraft((d) => ({ ...d, [ch]: "" })); run(ch, list); };
  return (<>
    <p className="mb-3 text-sm text-slate-400">Simulated inboxes. The agent only answers threads the customer started, stays on Amaka&apos;s services, books slots, and hands off on <b>HUMAN</b> or off-topic. Try: “Saturday 12:00 works”, or “who will win the election?”.</p>
    <div className="grid gap-4 md:grid-cols-3">{Object.entries(threads).map(([ch, list]) => (
      <div key={ch} className="glass flex h-[520px] flex-col p-3">
        <div className="mb-2 flex items-center justify-between"><b style={{ color: CH[ch as keyof typeof CH][1] }}>{CH[ch as keyof typeof CH][0]}</b><span className="tip text-[10px] text-slate-400" data-tip="Customer messaged first → 24h service window open">inbound ✓</span></div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">{list.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key={i} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${m.from === "customer" ? "bg-slate-700/60" : "ml-auto bg-emerald-500/15 border border-emerald-400/30"}`}>
            {m.text}{m.meta && <div className="mt-1 text-[10px] text-emerald-300/80">{m.meta}</div>}</motion.div>))}
          {busy === ch && <div className="ml-auto w-fit rounded-xl bg-emerald-500/10 px-3 py-2 text-xs neon">SalesCrew is typing…</div>}
        </div>
        {list.at(-1)?.from === "customer" && busy !== ch && <button className="btn mt-2 text-sm" onClick={() => run(ch, list)}>Let SalesCrew reply</button>}
        <div className="mt-2 flex gap-2"><input value={draft[ch] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [ch]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && send(ch)} placeholder="Reply as customer…" className="flex-1 rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-emerald-400/20" /><button className="btn-ghost text-sm" onClick={() => send(ch)}>Send</button></div>
      </div>))}</div></>);
}

function Leads() {
  const [d, setD] = useState<{ raw: number; cleaned: number; merged: number; leads: Lead[] } | null>(null);
  return (<div className="glass p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">One cleaned list</h2><p className="text-sm text-slate-400">Sources: FB/IG Lead Ads (webhook) · Page activity · Google search · Maps · public directories</p></div>
      <button className="btn" onClick={() => fetch("/api/leads").then((r) => r.json()).then(setD)}>Pull & clean leads</button></div>
    {d && <><p className="mt-4 text-sm neon">{d.raw} raw → {d.cleaned} clean ({d.merged} duplicate merged, phones normalised to +234, emails lower-cased)</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-2">Score</th><th>Name</th><th>Company</th><th>Source</th><th>Contact</th><th>Signal</th></tr></thead>
        <tbody>{d.leads.map((l) => <tr key={l.id} className="border-t border-white/5"><td className="p-2 font-bold neon">{l.score}</td><td>{l.name}</td><td>{l.company}</td><td>{l.source}</td><td className="text-xs">{l.email || "—"}<br />{l.phone}</td><td className="max-w-xs text-xs text-slate-300">{l.note}</td></tr>)}</tbody></table></div></>}
  </div>);
}

function Outreach({ prov }: { prov: Prov }) {
  const [leads, setLeads] = useState<Lead[]>([]); const [sel, setSel] = useState(0); const [out, setOut] = useState<{ text?: string; provider?: string; model?: string; fallback?: boolean } | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/leads").then((r) => r.json()).then((d) => setLeads(d.leads)); }, []);
  const l = leads[sel];
  return (<div className="grid gap-4 md:grid-cols-2">
    <div className="glass p-5"><h2 className="text-xl font-bold">Enrich → Muse Spark email</h2>
      <select className="mt-3 w-full rounded-lg bg-black/40 p-2 text-sm" value={sel} onChange={(e) => setSel(+e.target.value)}>{leads.map((x, i) => <option key={x.id} value={i}>{x.name} — {x.company}</option>)}</select>
      {l && <div className="mt-3 rounded-lg bg-black/30 p-3 text-xs text-slate-300"><b className="neon">Enrichment:</b> {l.source} · score {l.score}<br />{l.note}</div>}
      <button disabled={busy || !l} className="btn mt-4" onClick={async () => { setBusy(true); setOut(await post("/api/outreach", { lead: l, provider: prov })); setBusy(false); }}>{busy ? "Writing…" : "Write personalised email"}</button></div>
    <div className="glass p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Draft</h3>{out && <Badge r={out} />}</div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{out?.text ?? "—"}</pre>{out && <p className="mt-3 text-xs text-slate-400">Drafts are reviewed by the owner before sending (human-in-the-loop for outbound).</p>}</div>
  </div>);
}

function CallLab({ prov }: { prov: Prov }) {
  const [d, setD] = useState<{ transcript: { speaker: string; lang: string; text: string }[]; pipeline: Record<string, string>; analysis: string; provider: string } | null>(null); const [busy, setBusy] = useState(false); const [lang, setLang] = useState("Yoruba");
  return (<div className="glass p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Reply → multilingual call</h2><p className="text-sm text-slate-400">Simulated call (live telephony not connected in demo). Muse Voice Transcribe → diarized, code-switched text · SeamlessM4T → speech-to-speech</p></div>
      <div className="flex gap-2"><select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg bg-black/40 p-2 text-sm">{["Yoruba", "Igbo", "Hausa", "Nigerian Pidgin", "French"].map((x) => <option key={x}>{x}</option>)}</select>
        <button className="btn" disabled={busy} onClick={async () => { setBusy(true); setD(await post("/api/speech", { target: lang, provider: prov })); setBusy(false); }}>{busy ? "Processing…" : "Run call"}</button></div></div>
    {d && <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2">{d.transcript.map((t, i) => <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }} className="rounded-lg bg-black/30 p-2 text-sm"><span className="text-xs neon">{t.speaker}</span> <span className="text-[10px] text-slate-400">[{t.lang}]</span><br />{t.text}</motion.div>)}
      <div className="text-[11px] text-slate-400">{Object.entries(d.pipeline).map(([k, v]) => <div key={k}>{k}: {v}</div>)}</div></div>
      <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm">{d.analysis}</pre></div>}
  </div>);
}

function Bookings({ data, refresh, onWon }: { data: { slots: string[]; bookings: { id: string; slot: string; who: string; channel: string }[] }; refresh: () => void; onWon: (id: string) => void }) {
  return (<div className="grid gap-4 md:grid-cols-2">
    <div className="glass p-5"><h2 className="text-xl font-bold">Calendar</h2><div className="mt-3 space-y-2">{data.bookings.map((b) => <div key={b.id} className="flex items-center justify-between rounded-lg bg-black/30 p-3 text-sm"><span><b className="neon">{b.slot}</b> · {b.who} <span className="text-xs text-slate-400">via {b.channel}</span></span><button className="btn-ghost text-xs" onClick={() => onWon(b.id)}>Mark job won → CAPI</button></div>)}</div></div>
    <div className="glass p-5"><h3 className="font-bold">Open slots</h3><div className="mt-3 flex flex-wrap gap-2">{data.slots.map((s) => <span key={s} className="rounded-lg border border-emerald-400/30 px-3 py-1 text-sm">{s}</span>)}</div><button className="btn-ghost mt-4 text-sm" onClick={refresh}>Refresh</button></div>
  </div>);
}

function Capi({ log, fire }: { log: Cap[]; fire: (e: string, x?: Record<string, unknown>) => void }) {
  return (<div className="glass p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Conversions API loop</h2><p className="text-sm text-slate-400">Events go back to Meta so Lead Ads optimise for revenue. PII is SHA-256 hashed. Dry-run unless META_PIXEL_ID + META_CAPI_TOKEN are set.</p></div>
      <div className="flex gap-2"><button className="btn-ghost text-sm" onClick={() => fire("meeting_booked", { email: "tonye@briggsevents.ng", value: 0 })}>meeting_booked</button><button className="btn text-sm" onClick={() => fire("job_won", { email: "tonye@briggsevents.ng", phone: "+2348031112222", value: 540000 })}>job_won ₦540k</button></div></div>
    <div className="mt-4 space-y-3">{log.length === 0 && <p className="text-sm text-slate-500">No events yet — book a slot in the Inbox or fire one above.</p>}{log.map((c, i) => <div key={i} className="rounded-lg bg-black/40 p-3"><div className="text-xs neon">{c.at} · {c.event}</div><pre className="mt-1 overflow-x-auto text-[11px] text-slate-300">{JSON.stringify(c.body, null, 2)}</pre></div>)}</div>
  </div>);
}

function Site({ prov }: { prov: Prov }) {
  const [d, setD] = useState<{ html: string; model: string; provider: string; fallback: boolean; source: { posts: string[]; reviews: string[] } } | null>(null); const [busy, setBusy] = useState(false);
  return (<div className="grid gap-4 md:grid-cols-3">
    <div className="glass p-5"><h2 className="text-xl font-bold">Page → one-page site</h2><p className="mt-1 text-sm text-slate-400">Muse Code-style generation from the business&apos;s own Facebook Page posts, reviews and photos.</p>
      <button className="btn mt-4" disabled={busy} onClick={async () => { setBusy(true); setD(await post("/api/site", { provider: prov })); setBusy(false); }}>{busy ? "Generating…" : "Generate site"}</button>
      {d && <div className="mt-4 space-y-1 text-xs text-slate-300"><Badge r={d} />{d.source.posts.map((p) => <div key={p}>📌 {p}</div>)}{d.source.reviews.map((p) => <div key={p}>⭐ {p}</div>)}</div>}</div>
    <div className="glass md:col-span-2 overflow-hidden p-2">{d ? <iframe title="preview" sandbox="" srcDoc={d.html} className="h-[600px] w-full rounded-lg bg-white" /> : <div className="grid h-[600px] place-items-center text-slate-500">Preview appears here</div>}</div>
  </div>);
}

function Settings({ prov, setProv }: { prov: Prov; setProv: (p: Prov) => void }) {
  const [h, setH] = useState<Record<string, unknown> | null>(null); const [ping, setPing] = useState<Record<string, unknown> | null>(null);
  useEffect(() => { fetch("/api/health").then((r) => r.json()).then(setH); }, []);
  return (<div className="grid gap-4 md:grid-cols-2">
    <div className="glass p-5"><h2 className="text-xl font-bold">AI provider order</h2>
      {(["meta", "nvidia"] as Prov[]).map((p) => <label key={p} className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg bg-black/30 p-3"><input type="radio" checked={prov === p} onChange={() => setProv(p)} /><span>{p === "meta" ? "Meta Model API primary (Muse Spark) → NVIDIA Nemotron fallback" : "NVIDIA Nemotron primary → Meta fallback"}</span></label>)}
      <button className="btn mt-4" onClick={async () => setPing(await (await fetch(`/api/health?ping=${prov}`)).json())}>Test connection</button>
      {ping && <pre className="mt-3 text-xs text-slate-300">{JSON.stringify(ping, null, 2)}</pre>}</div>
    <div className="glass p-5"><h3 className="font-bold">Guardrails (Meta 2026 messaging policy)</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300"><li>Replies only to user-initiated threads (inside the service window)</li><li>Scope: prices, availability, bookings, order status, delivery, rescheduling</li><li>Off-topic → polite refusal + human handoff</li><li>“HUMAN” pauses the agent on that thread</li><li>Outbound emails are owner-approved drafts</li></ul>
      <h3 className="mt-4 font-bold">Server status</h3><pre className="text-xs text-slate-400">{JSON.stringify(h, null, 2)}</pre></div>
  </div>);
}
