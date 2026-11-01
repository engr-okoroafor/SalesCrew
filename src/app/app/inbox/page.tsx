"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useData, inVendor, upload } from "@/lib/client/data";
import { ChannelIcon } from "@/components/icons/ChannelIcons";
import { I } from "@/components/icons/Futur";
import { Tip, Chevron, Dots, toast, ago, money, Toggle } from "@/components/ui";
import type { Conversation } from "@/lib/schema";
const CH = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" } as Record<string, string>;
const SHORT = { all: "All", whatsapp: "WA", messenger: "FB", instagram: "IG" } as Record<string, string>;
const initials = (n: string) => n.replace(/^@/, "").split(/[ ._]/).map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
// Real identity per channel: WhatsApp → phone (+ profile photo if uploaded), Messenger → Facebook name, Instagram → @handle.
export const identity = (c: Conversation) => { const p = c.profile ?? {};
  if (c.channel === "whatsapp") return { title: p.name || c.contact, sub: p.phone || (/^\d{8,}$/.test(c.contactId) ? `+${c.contactId}` : "WhatsApp number pending"), photo: p.photo || c.avatar };
  if (c.channel === "instagram") return { title: p.handle ? `@${p.handle}` : c.contact, sub: p.name && p.handle ? p.name : "Instagram handle", photo: p.photo || c.avatar };
  return { title: p.name || c.contact, sub: p.username && p.username !== p.name ? p.username : "Facebook / Messenger", photo: p.photo || c.avatar }; };
const Avatar = ({ c, size = 44 }: { c: Conversation; size?: number }) => { const id = identity(c);
  return <div className="relative shrink-0" style={{ width: size, height: size }}>{id.photo ? <img src={id.photo} alt="" className="h-full w-full rounded-full object-cover ring-1 ring-[#39ff88]/30" /> : <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#39ff88]/30 to-[#22d3ee]/20 text-sm font-bold">{initials(id.title)}</div>}
    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#05070a] p-0.5"><ChannelIcon ch={c.channel} size={Math.round(size / 3)} /></span></div>; };
export default function Inbox() {
  const { w, vendor, set, api } = useData(); const [sel, setSel] = useState<string>(""); const [q, setQ] = useState(""); const [ch, setCh] = useState("all"); const [onlyUnread, setOnlyUnread] = useState(false);
  const [text, setText] = useState(""); const [media, setMedia] = useState<{ url: string; type: "image" | "video" }[]>([]); const [busy, setBusy] = useState(""); const [sim, setSim] = useState(false); const [mobileList, setMobileList] = useState(true);
  const end = useRef<HTMLDivElement>(null); const fileRef = useRef<HTMLInputElement>(null);
  const convs = useMemo(() => (w?.conversations ?? []).filter(inVendor(vendor)).filter((c) => ch === "all" || c.channel === ch).filter((c) => !onlyUnread || c.unread > 0)
    .filter((c) => { if (!q) return true; const s = q.toLowerCase(); const id = identity(c); return [c.contact, id.title, id.sub].some((x) => x?.toLowerCase().includes(s)) || c.messages.some((m) => m.text.toLowerCase().includes(s)); })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [w, vendor, ch, q, onlyUnread]);
  const c = convs.find((x) => x.id === sel) ?? convs[0]; const lead = w?.leads.find((l) => l.id === c?.leadId); const v = w?.vendors.find((x) => x.id === c?.vendorId);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [c?.messages.length, c?.id]);
  const act = async (action: string, extra: object = {}, conv = c) => { if (!conv) return; setBusy(action); try { const j = await api("/api/inbox", { conversationId: conv.id, action, ...extra }); if (j.workspace) set(j.workspace); if (j.draft) { setText(j.draft); toast("AI draft ready — review, edit, then Send"); }
    if (j.delivery?.dryRun) toast(`Saved — live ${CH[conv.channel]} delivery needs this vendor's channel token (Admin → Vendors).`); else if (j.delivery?.ok) toast(`Sent via ${CH[conv.channel]} (Meta Graph)`); else if (j.delivery?.error) toast(`Meta error: ${j.delivery.error}`); if (j.ai?.fallback) toast(`AI fallback used: ${j.ai.provider}`); } finally { setBusy(""); } };
  const open = (x: Conversation) => { setSel(x.id); setMobileList(false); if (x.unread) act("markRead", {}, x); };
  if (!w) return null;
  const autoOn = !!c?.aiOn && w.settings.ai.autoReply;
  const windowOpen = c?.window24h ? Date.now() - +new Date(c.window24h) < 864e5 : c?.messages.some((m) => m.from === "customer" && Date.now() - +new Date(m.at) < 864e5);
  const send = async () => { if (!text.trim() && !media.length) return; await act(sim ? "inbound" : "send", { text, media: media.length ? media : undefined }); setText(""); setMedia([]); };
  const onFiles = async (f: FileList | null) => { if (!f?.length) return; setBusy("upload"); try { setMedia([...media, ...(await upload(f))]); } finally { setBusy(""); } };
  const unreadTotal = convs.reduce((s, x) => s + x.unread, 0); const id = c ? identity(c) : null;
  return <div className="glass grid h-[calc(100dvh-7.5rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_280px]">
    <div className={`min-h-0 flex-col border-r border-white/5 ${mobileList ? "flex" : "hidden md:flex"}`}>
      <div className="space-y-2 p-3"><input className="inp" placeholder="Search name, @handle, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-black/30 p-1">{["all", "whatsapp", "messenger", "instagram"].map((k) => <Tip key={k} text={k === "all" ? "All channels" : `Only ${CH[k]}`} side="bottom">
          <button onClick={() => setCh(k)} className={`relative flex w-full items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs ${ch === k ? "text-black" : "text-white/60 hover:text-white"}`}>{ch === k && <motion.span layoutId="chf" className="absolute inset-0 rounded-lg bg-[#39ff88]" />}<span className="relative flex items-center gap-1">{k !== "all" && <ChannelIcon ch={k} size={13} />}{SHORT[k]}</span></button></Tip>)}</div>
        <div className="flex items-center justify-between text-[11px] text-white/45"><Tip text="Show only threads with unread messages"><button onClick={() => setOnlyUnread(!onlyUnread)} className={`chip !py-0.5 ${onlyUnread ? "chip-on" : ""}`}>Unread · {unreadTotal}</button></Tip>
          {unreadTotal > 0 && <Tip text="Mark every visible thread as read"><button className="underline" onClick={async () => { for (const x of convs.filter((x) => x.unread)) await act("markRead", {}, x); }}>Mark all read</button></Tip>}</div></div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{convs.map((x) => { const last = x.messages[x.messages.length - 1]; const on = x.id === c?.id; const xi = identity(x);
        return <button key={x.id} onClick={() => open(x)} className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${on ? "bg-[#39ff88]/10" : "hover:bg-white/5"}`}>
          <Avatar c={x} />
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`truncate text-sm ${x.unread ? "font-bold" : ""}`}>{xi.title}</span><span className="shrink-0 text-[10px] text-white/40">{ago(x.updatedAt)}</span></div>
            <div className="truncate text-[10.5px] text-[#22d3ee]/70">{xi.sub}</div>
            <div className="flex items-center gap-1 text-xs text-white/50"><span className="truncate">{last?.from !== "customer" ? (last?.from === "ai" ? "AI: " : "You: ") : ""}{last?.media?.length ? "📎 " : ""}{last?.text}</span>{x.unread > 0 && <span className="ml-auto rounded-full bg-[#39ff88] px-1.5 text-[10px] font-bold text-black">{x.unread}</span>}</div></div></button>; })}
        {!convs.length && <p className="p-6 text-center text-sm text-white/40">No conversations for this filter.</p>}</div></div>
    {c && id ? <div className={`min-h-0 flex-col ${mobileList ? "hidden md:flex" : "flex"}`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-3 py-2.5 sm:px-4">
        <button className="text-[#39ff88] md:hidden" onClick={() => setMobileList(true)} aria-label="Back"><I.left /></button>
        <Avatar c={c} size={38} />
        <div className="min-w-0"><div className="flex items-center gap-2 truncate font-semibold">{id.title}</div><div className="truncate text-xs text-white/45">{id.sub} · {CH[c.channel]} · {v?.name}</div></div>
        <div className="ml-auto flex items-center gap-2">
          <Tip text={c.unread ? "Mark as read" : "Mark as unread"} side="bottom"><button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => act("markRead", { unread: !c.unread })}>{c.unread ? "Read" : "Unread"}</button></Tip>
          <Tip text={<>ON: AI answers every new customer message automatically on {CH[c.channel]}.<br />OFF: you reply manually or use “AI draft” to review first.{!w.settings.ai.autoReply && <><br /><b className="text-amber-300">Workspace auto-reply is off in Settings.</b></>}</>} side="bottom"><Toggle on={c.aiOn} onChange={() => act("toggleAI")} label={<span className="text-xs">Auto-reply</span>} /></Tip></div></div>
      <div className={`mx-3 mt-3 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs sm:mx-4 ${windowOpen ? "border-[#39ff88]/30 bg-[#39ff88]/5 text-[#b9ffd6]" : "border-amber-400/30 bg-amber-400/5 text-amber-200"}`}>
        <span className={`h-2 w-2 rounded-full ${windowOpen ? "bg-[#39ff88] shadow-[0_0_8px_#39ff88]" : "bg-amber-400"}`} /><span className="flex-1">{windowOpen ? "24h reply window open" : "24h window closed — templates only"}</span>
        <span className="hidden text-white/40 sm:inline">{autoOn ? "AI is answering" : "Manual mode"}</span>
        <Tip text="Meta allows free-form replies within 24h of the customer's last message. Outside it, use an approved template / message tag."><span className="cursor-help rounded-full border border-current px-1.5">?</span></Tip></div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-thin p-3 sm:p-4"><AnimatePresence initial={false}>{c.messages.map((m) => { const out = m.from !== "customer";
        return <motion.div key={m.id} initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${out ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[75%] ${out ? "bubble-out rounded-br-md" : "bubble-in rounded-bl-md"}`}>
            {m.media?.map((x, i) => x.type === "video" ? <video key={i} src={x.url} controls className="mb-1.5 max-h-60 rounded-lg" /> : <img key={i} src={x.url} alt="" className="mb-1.5 max-h-60 rounded-lg" />)}
            {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
            <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/45">{m.from === "ai" && <span className="text-[#22d3ee]">AI</span>}{m.from === "agent" && <span>You</span>}{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {out && m.status && <Tip text={{ sent: `Sent through Meta Graph (${CH[c.channel]})`, delivered: "Delivered", read: "Read", "dry-run": "Saved here only — connect this vendor's channel token to deliver live", failed: "Delivery failed" }[m.status]}><span className={m.status === "dry-run" ? "text-amber-300" : m.status === "failed" ? "text-red-400" : "text-[#39ff88]"}>{m.status === "dry-run" ? "◌ local" : m.status === "failed" ? "✕" : "✓✓"}</span></Tip>}</div></div></motion.div>; })}</AnimatePresence>
        {busy === "ai" && <div className="flex justify-end"><div className="bubble-out rounded-2xl px-4 py-3"><Dots /></div></div>}<div ref={end} /></div>
      {media.length > 0 && <div className="flex gap-2 px-4">{media.map((m, i) => <div key={i} className="relative">{m.type === "video" ? <video src={m.url} className="h-16 rounded-lg" /> : <img src={m.url} alt="" className="h-16 rounded-lg" />}<button onClick={() => setMedia(media.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-black px-1 text-xs">✕</button></div>)}</div>}
      <div className="flex items-end gap-2 border-t border-white/5 p-2.5 sm:p-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <Tip text="Attach photo or video"><button onClick={() => fileRef.current?.click()} className="btn-ghost !px-2.5">{busy === "upload" ? <Dots /> : <I.clip />}</button></Tip>
        <Tip text="AI draft reply — fills the box so you can review and edit before sending"><button onClick={() => act("ai", { draftOnly: true })} className="btn-ghost !px-2.5" aria-label="AI draft reply">{busy === "ai" ? <Dots /> : <><I.spark /><span className="hidden text-xs lg:inline">AI draft</span></>}</button></Tip>
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder={sim ? "Type as the customer (test)…" : `Reply on ${CH[c.channel]}…`} className="inp max-h-32 min-h-[40px] flex-1 resize-none" />
        <Tip text={sim ? "Inject as a customer message" : `Send via Meta Graph on ${CH[c.channel]}`}><button onClick={send} disabled={!!busy} className="btn !px-3" aria-label="Send">{busy === "send" ? <Dots /> : <I.send />}</button></Tip></div>
      <div className="flex items-center gap-3 px-4 pb-2 text-[11px] text-white/35"><Tip text="Simulate an inbound customer message to test auto-reply"><label className="flex items-center gap-1.5"><input type="checkbox" className="ck !h-3.5 !w-3.5" checked={sim} onChange={(e) => setSim(e.target.checked)} />Test as customer</label></Tip></div>
    </div> : <div className="hidden place-items-center text-white/40 md:grid">Select a conversation</div>}
    {c && id && <aside className="hidden min-h-0 overflow-y-auto scroll-thin border-l border-white/5 p-4 xl:block">
      <div className="label mb-2">Contact</div><div className="mb-3 flex items-center gap-3"><Avatar c={c} size={52} /><div className="min-w-0 text-sm"><div className="truncate font-semibold">{c.profile?.name || c.contact}</div>
        {c.profile?.phone && <div className="text-white/60">{c.profile.phone}</div>}{c.profile?.handle && <a className="text-[#22d3ee] underline" target="_blank" href={`https://instagram.com/${c.profile.handle}`}>@{c.profile.handle}</a>}{c.profile?.username && c.channel === "messenger" && <div className="text-white/60">FB: {c.profile.username}</div>}</div></div>
      <div className="label mb-2">Lead</div>{lead ? <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1"><span className="chip chip-on">{lead.stage}</span><span className="chip">{lead.segment}</span><Tip text="Lead score 0–100 from channel, intent, data completeness"><span className="chip">★ {lead.score}</span></Tip></div>
        <div className="text-white/60">{lead.email}</div><div>Value: <b className="neon">{money(lead.value, v?.currency)}</b></div>
        <Link href={`/app/leads?id=${lead.id}`} className="group btn-ghost w-full justify-between">Open lead <Chevron /></Link>
        <Link href={`/app/outreach?mode=call&leads=${lead.id}`} className="group btn-ghost w-full justify-between">Call with AI <Chevron /></Link>
        <button onClick={async () => { const j = await api("/api/pay", { leadId: lead.id }); if (j.url) { navigator.clipboard?.writeText(j.url); setText(`Here's your secure payment link (ref ${j.ref}): ${j.url}`); toast("Payment link added to reply"); } else toast(j.message ?? "Payment link failed"); }} className="group btn-ghost w-full justify-between">Payment link <Chevron /></button></div> : <p className="text-sm text-white/40">No lead linked.</p>}
      <div className="label mb-2 mt-5">Agent memory</div><div className="space-y-1.5">{w.memory.filter((m) => m.leadId === lead?.id).slice(0, 6).map((m) => <div key={m.id} className="rounded-lg bg-white/5 p-2 text-xs"><span className={m.scope === "long" ? "text-[#22d3ee]" : "text-[#39ff88]"}>{m.scope}</span> {m.text}</div>)}</div>
    </aside>}</div>;
}
