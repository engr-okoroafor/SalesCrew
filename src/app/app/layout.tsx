"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "@/lib/client/data";
import { Orbit, Tip, Toast } from "@/components/ui";
import Translate from "@/components/Translate";
import ScrollFab from "@/components/ScrollFab";
import { I, type IconName } from "@/components/icons/Futur";
import { motion, AnimatePresence } from "framer-motion";
const NAV: [string, string, IconName, string][] = [
  ["inbox", "Inbox", "inbox", "Unified WhatsApp · Messenger · Instagram conversations"], ["leads", "Leads", "leads", "Pipeline, scoring and lead capture"], ["products", "Products", "products", "Catalog, photos and buyer analytics"],
  ["outreach", "Engage", "engage", "Calls + messages + post engagement in one place"], ["bookings", "Bookings", "bookings", "Calendar and booked slots"], ["capi", "CAPI", "capi", "Send conversions back to Meta Ads"],
  ["sites", "Site builder", "sites", "Build & deploy sites/apps with AI"], ["settings", "Settings", "settings", "Channels, AI, payments"], ["admin", "Admin", "admin", "Vendors, knowledge, autopilot, AI admin"]];
function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname(); const { w, vendor, setVendor, session, backend, api } = useData();
  const [mini, setMini] = useState(false); const [drawer, setDrawer] = useState(false);
  useEffect(() => { const s = localStorage.getItem("sc-mini"); setMini(s ? s === "1" : innerWidth < 1200); }, []);
  useEffect(() => setDrawer(false), [p]);
  const toggle = () => { setMini(!mini); localStorage.setItem("sc-mini", mini ? "0" : "1"); };
  const unread = w?.conversations.reduce((s, c) => s + c.unread, 0) ?? 0; const pending = w?.approvals?.filter((a) => a.status === "pending").length ?? 0;
  const Nav = ({ compact }: { compact: boolean }) => <>{NAV.map(([k, label, ic, tip]) => { const on = p?.startsWith(`/app/${k}`); const badge = k === "inbox" ? unread : k === "admin" ? pending : 0;
    const link = <Link key={k} href={`/app/${k}`} aria-label={label} className={`group relative flex flex-1 items-center gap-3 rounded-xl py-2 text-sm transition ${compact ? "justify-center px-0" : "px-3"} ${on ? "text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
      {on && <motion.span layoutId={compact ? "navc" : "nav"} className="absolute inset-0 rounded-xl border border-[#39ff88]/40 bg-[#39ff88]/10 shadow-[0_0_20px_-6px_#39ff88]" />}
      <span className={`relative transition ${on ? "text-[#39ff88] drop-shadow-[0_0_6px_#39ff88]" : "group-hover:text-[#22d3ee]"}`}>{I[ic]({ size: 19 })}</span>
      {!compact && <span className="relative flex-1 truncate">{label}</span>}
      {badge > 0 && <span className={`relative rounded-full bg-[#39ff88] px-1.5 text-[10px] font-bold text-black ${compact ? "absolute -right-0.5 -top-0.5" : ""}`}>{badge}</span>}</Link>;
    return <Tip key={k} text={<><b>{label}</b><br /><span className="text-white/60">{tip}</span></>} side="right">{link}</Tip>; })}</>;
  return <div className="flex min-h-screen">
    <motion.aside animate={{ width: mini ? 68 : 232 }} transition={{ type: "spring", stiffness: 260, damping: 30 }} className="sticky top-0 hidden h-screen shrink-0 flex-col gap-1 overflow-hidden border-r border-white/5 bg-black/25 p-2.5 backdrop-blur-xl md:flex">
      <div className={`mb-2 flex items-center ${mini ? "flex-col gap-2" : "justify-between"} px-1 py-1.5`}>
        <Link href="/" className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#39ff88] font-black text-black shadow-[0_0_20px_#39ff88]">S</span>{!mini && <span className="font-bold">Sales<span className="neon">Crew</span></span>}</Link>
        <Tip text={mini ? "Expand sidebar" : "Collapse sidebar"} side="right"><button onClick={toggle} aria-label="Toggle sidebar" className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-[#39ff88]">{mini ? <I.expand /> : <I.collapse />}</button></Tip></div>
      <Nav compact={mini} />
      <div className="mt-auto space-y-2 px-1 text-xs text-white/50">
        <Tip text={`Data store: ${backend || "…"} — persistent`} side="right"><span className="chip">● {mini ? "" : backend || "…"}</span></Tip>
        {!mini && <div>{session ? <>{session.name || session.email} · <button className="underline" onClick={async () => { await api("/api/auth", { action: "logout" }); location.href = "/login"; }}>Sign out</button></> : <Link href="/login" className="underline">Guest (demo) — Sign in</Link>}</div>}</div>
    </motion.aside>
    <AnimatePresence>{drawer && <motion.div className="fixed inset-0 z-[70] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
      <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28 }} className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 border-r border-[#39ff88]/20 bg-[#05070a]/95 p-3">
        <div className="mb-2 px-2 py-2 font-bold">Sales<span className="neon">Crew</span></div><Nav compact={false} /></motion.aside></motion.div>}</AnimatePresence>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-white/5 bg-black/30 px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <button className="rounded-lg p-1.5 text-[#39ff88] md:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><I.expand size={20} /></button>
        <div className="truncate text-sm text-white/50">{NAV.find(([k]) => p?.startsWith(`/app/${k}`))?.[1] ?? w?.name}</div>
        <div className="ml-auto flex items-center gap-2">
          <Tip text="Filter the whole app by vendor" side="bottom"><select className="inp !w-auto max-w-[9rem] !py-1 text-xs sm:max-w-none" value={vendor} onChange={(e) => setVendor(e.target.value)} aria-label="Vendor"><option value="all">All vendors</option>{w?.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Tip>
          <Translate compact /></div></header>
      <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">{w ? children : <Orbit label="Syncing workspace" />}</main></div>
    <ScrollFab /><Toast /></div>;
}
export default function L({ children }: { children: React.ReactNode }) { return <DataProvider><Shell>{children}</Shell></DataProvider>; }
