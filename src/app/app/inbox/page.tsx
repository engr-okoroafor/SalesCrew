"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useData, inVendor, upload } from "@/lib/client/data";
import { ChannelIcon } from "@/components/icons/ChannelIcons";
import { Tip, Chevron, Dots, toast, ago, money, Toggle } from "@/components/ui";
const CH = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" } as Record<string, string>;
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export default function Inbox() {
  const { w, vendor, set, api } = useData(); const [sel, setSel] = useState<string>(""); const [q, setQ] = useState(""); const [ch, setCh] = useState("all");
  const [text, setText] = useState(""); const [media, setMedia] = useState<{ url: string; type: "image" | "video" }[]>([]); const [busy, setBusy] = useState(""); const [sim, setSim] = useState(false);
  const end = useRef<HTMLDivElement>(null); const fileRef = useRef<HTMLInputElement>(null);
  const convs = useMemo(() => (w?.conversations ?? []).filter(inVendor(vendor)).filter((c) => ch === "all" || c.channel === ch).filter((c) => !q || c.contact.toLowerCase().includes(q.toLowerCase()) || c.messages.some((m) => m.text.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [w, vendor, ch, q]);
  const c = convs.find((x) => x.id === sel) ?? convs[0]; const lead = w?.leads.find((l) => l.id === c?.leadId); const v = w?.vendors.find((x) => x.id === c?.vendorId);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [c?.messages.length, c?.id]);
  if (!w) return null;
  const windowOpen = c?.window24h ? Date.now() - +new Date(c.window24h) < 864e5 : c?.messages.some((m) => m.from === "customer" && Date.now() - +new Date(m.at) < 864e5);
  const act = async (action: string, extra: object = {}) => { if (!c) return; setBusy(action); try { const j = await api("/api/inbox", { conversationId: c.id, action, ...extra }); if (j.workspace) set(j.workspace); if (j.draft) setText(j.draft);
    if (j.delivery?.dryRun) toast("Saved — live delivery needs this vendor's channel token (Settings → Channels)."); if (j.ai?.fallback) toast(`AI fallback used: ${j.ai.provider}`); } finally { setBusy(""); } };
  const send = async () => { if (!text.trim() && !media.length) return; await act(sim ? "inbound" : "send", { text, media: media.length ? media : undefined }); setText(""); setMedia([]); };
  const onFiles = async (f: FileList | null) => { if (!f?.length) return; setBusy("upload"); try { setMedia([...media, ...(await upload(f))]); } finally { setBusy(""); } };
  return <div className="glass grid h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_280px]">
    <div className="flex min-h-0 flex-col border-r border-white/5">
      <div className="space-y-2 p-3"><input className="inp" placeholder="Search conversations…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1">{["all", "whatsapp", "messenger", "instagram"].map((k) => <button key={k} onClick={() => setCh(k)} className={`chip ${ch === k ? "chip-on" : ""}`}>{k === "all" ? "All" : <><ChannelIcon ch={k} size={13} />{CH[k]}</>}</button>)}</div></div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{convs.map((x) => { const last = x.messages[x.messages.length - 1]; const on = x.id === c?.id;
        return <button key={x.id} onClick={() => setSel(x.id)} className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${on ? "bg-[#39ff88]/10" : "hover:bg-white/5"}`}>
          <div className="relative"><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#39ff88]/30 to-[#22d3ee]/20 text-sm font-bold">{initials(x.contact)}</div><span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#05070a] p-0.5"><ChannelIcon ch={x.channel} size={15} /></span></div>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className={`truncate text-sm ${x.unread ? "font-bold" : ""}`}>{x.contact}</span><span className="text-[10px] text-white/40">{ago(x.updatedAt)}</span></div>
            <div className="flex items-center gap-1 text-xs text-white/50"><span className="truncate">{last?.from !== "customer" ? (last?.from === "ai" ? "🤖 " : "You: ") : ""}{last?.media?.length ? "📎 " : ""}{last?.text}</span>{x.unread > 0 && <span className="ml-auto rounded-full bg-[#39ff88] px-1.5 text-[10px] font-bold text-black">{x.unread}</span>}</div></div></button>; })}
        {!convs.length && <p className="p-6 text-center text-sm text-white/40">No conversations for this filter.</p>}</div></div>
    {c ? <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#39ff88]/20 text-xs font-bold">{initials(c.contact)}</div>
        <div className="min-w-0"><div className="flex items-center gap-2 font-semibold">{c.contact}<ChannelIcon ch={c.channel} size={14} /></div><div className="text-xs text-white/45">{CH[c.channel]} · {v?.name}</div></div>
        <div className="ml-auto flex items-center gap-3"><Tip text="When on, the AI agent replies automatically to new customer messages on this thread." side="bottom"><Toggle on={c.aiOn} onChange={() => act("toggleAI")} label={<span className="text-xs">AI auto-reply</span>} /></Tip></div></div>
      <div className={`mx-4 mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${windowOpen ? "border-[#39ff88]/30 bg-[#39ff88]/5 text-[#b9ffd6]" : "border-amber-400/30 bg-amber-400/5 text-amber-200"}`}>
        <span>{windowOpen ? "🟢" : "🟠"}</span><span>{windowOpen ? <>The customer messaged you first, so you can reply freely for 24 hours (Meta messaging policy).</> : <>24-hour reply window closed — only approved WhatsApp templates or Messenger message tags can be sent until the customer writes again.</>}</span>
        <Tip text="Meta only allows free-form business replies within 24h of the customer's last message. Outside it, use a pre-approved template."><span className="ml-auto cursor-help rounded-full border border-current px-1.5">?</span></Tip></div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-thin p-4"><AnimatePresence initial={false}>{c.messages.map((m) => { const out = m.from !== "customer";
        return <motion.div key={m.id} initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${out ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${out ? "bubble-out rounded-br-md" : "bubble-in rounded-bl-md"}`}>
            {m.media?.map((x, i) => x.type === "video" ? <video key={i} src={x.url} controls className="mb-1.5 max-h-60 rounded-lg" /> : <img key={i} src={x.url} alt="" className="mb-1.5 max-h-60 rounded-lg" />)}
            {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
            <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/45">{m.from === "ai" && <span>🤖 AI</span>}{m.from === "agent" && <span>👤 Agent</span>}{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {out && m.status && <Tip text={{ sent: "Delivered to Meta", delivered: "Delivered", read: "Read", "dry-run": "Saved here only — connect this vendor's channel token to deliver live", failed: "Delivery failed" }[m.status]}><span className={m.status === "dry-run" ? "text-amber-300" : m.status === "failed" ? "text-red-400" : "text-[#39ff88]"}>{m.status === "dry-run" ? "◌ local" : m.status === "failed" ? "✕" : "✓✓"}</span></Tip>}</div></div></motion.div>; })}</AnimatePresence>
        {busy === "ai" && <div className="flex justify-end"><div className="bubble-out rounded-2xl px-4 py-3"><Dots /></div></div>}<div ref={end} /></div>
      {media.length > 0 && <div className="flex gap-2 px-4">{media.map((m, i) => <div key={i} className="relative">{m.type === "video" ? <video src={m.url} className="h-16 rounded-lg" /> : <img src={m.url} alt="" className="h-16 rounded-lg" />}<button onClick={() => setMedia(media.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-black px-1 text-xs">✕</button></div>)}</div>}
      <div className="flex items-end gap-2 border-t border-white/5 p-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <Tip text="Attach photo or video"><button onClick={() => fileRef.current?.click()} className="btn-ghost !px-2.5">{busy === "upload" ? <Dots /> : "📎"}</button></Tip>
        <Tip text="Let AI draft a reply (you can edit before sending)"><button onClick={() => act("ai", { draftOnly: true })} className="btn-ghost !px-2.5">{busy === "ai" ? <Dots /> : "✨"}</button></Tip>
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder={sim ? "Type as the customer (test)…" : `Reply on ${CH[c.channel]}…`} className="inp max-h-32 min-h-[40px] flex-1 resize-none" />
        <button onClick={send} disabled={!!busy} className="btn">Send <Chevron /></button></div>
      <div className="flex items-center gap-3 px-4 pb-2 text-[11px] text-white/40"><label className="flex items-center gap-1.5"><input type="checkbox" className="ck !h-3.5 !w-3.5" checked={sim} onChange={(e) => setSim(e.target.checked)} />Test mode: send as customer (AI will auto-reply)</label><button onClick={() => act("ai")} className="underline">AI reply now</button></div>
    </div> : <div className="grid place-items-center text-white/40">Select a conversation</div>}
    {c && <aside className="hidden min-h-0 overflow-y-auto scroll-thin border-l border-white/5 p-4 xl:block">
      <div className="label mb-2">Lead</div>{lead ? <div className="space-y-2 text-sm"><div className="text-lg font-semibold">{lead.name}</div><div className="text-white/60">{lead.company}</div>
        <div className="flex flex-wrap gap-1"><span className="chip chip-on">{lead.stage}</span><span className="chip">{lead.customerType}</span><span className="chip">{lead.segment}</span><Tip text="Lead score 0–100 from channel, intent, data completeness"><span className="chip">★ {lead.score}</span></Tip></div>
        <div className="text-white/60">{lead.email}<br />{lead.phone}</div><div>Value: <b className="neon">{money(lead.value, v?.currency)}</b></div><p className="text-xs text-white/50">{lead.note}</p>
        <Link href={`/app/leads?id=${lead.id}`} className="group btn-ghost w-full justify-between">Open lead <Chevron /></Link>
        <Link href={`/app/calls?lead=${lead.id}`} className="group btn-ghost w-full justify-between">Call with AI <Chevron /></Link>
        <button onClick={async () => { const j = await api("/api/pay", { leadId: lead.id }); toast(j.url ? "Payment link created — copied" : j.message); if (j.url) navigator.clipboard?.writeText(j.url); if (j.url) setText(`Here's your secure payment link: ${j.url}`); }} className="group btn-ghost w-full justify-between">Send payment link <Chevron /></button></div> : <p className="text-sm text-white/40">No lead linked.</p>}
      <div className="label mb-2 mt-5">Memory</div><div className="space-y-1.5">{w.memory.filter((m) => m.leadId === lead?.id).slice(0, 6).map((m) => <div key={m.id} className="rounded-lg bg-white/5 p-2 text-xs"><span className={m.scope === "long" ? "text-[#22d3ee]" : "text-[#39ff88]"}>{m.scope}·{m.kind}</span> {m.text}</div>)}</div>
    </aside>}</div>;
}
