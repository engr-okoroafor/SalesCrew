"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "@/lib/client/data";
import { Chevron, Orbit, Tip, Toast } from "@/components/ui";
import Translate from "@/components/Translate";
import { motion } from "framer-motion";
const NAV = [["inbox", "Inbox", "💬"], ["leads", "Leads", "🎯"], ["products", "Products", "📦"], ["outreach", "Outreach", "🚀"], ["calls", "Call Lab", "📞"], ["bookings", "Bookings", "📅"], ["capi", "CAPI", "📡"], ["sites", "Site builder", "🧩"], ["memory", "Memory & NBA", "🧠"], ["settings", "Settings", "⚙️"], ["admin", "Admin", "🛡️"]] as const;
function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname(); const { w, vendor, setVendor, session, backend, api } = useData();
  const unread = w?.conversations.reduce((s, c) => s + c.unread, 0) ?? 0;
  return <div className="flex min-h-screen">
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-white/5 bg-black/20 p-3 backdrop-blur-xl md:flex">
      <Link href="/" className="mb-3 flex items-center gap-2 px-2 py-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#39ff88] font-black text-black shadow-[0_0_20px_#39ff88]">S</span><span className="font-bold">Sales<span className="neon">Crew</span></span></Link>
      {NAV.map(([k, label, ic]) => { const on = p?.startsWith(`/app/${k}`); return <Link key={k} href={`/app/${k}`} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${on ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
        {on && <motion.span layoutId="nav" className="absolute inset-0 rounded-xl border border-[#39ff88]/40 bg-[#39ff88]/10 shadow-[0_0_20px_-6px_#39ff88]" />}
        <span className="relative">{ic}</span><span className="relative flex-1">{label}</span>{k === "inbox" && unread > 0 && <span className="relative rounded-full bg-[#39ff88] px-1.5 text-[10px] font-bold text-black">{unread}</span>}<span className="relative"><Chevron size={12} /></span></Link>; })}
      <div className="mt-auto space-y-2 px-1 text-xs text-white/50">
        <Tip text={`Data store: ${backend || "…"} — persistent`} side="right"><span className="chip">● {backend || "…"}</span></Tip>
        <div>{session ? <>{session.name || session.email} · <button className="underline" onClick={async () => { await api("/api/auth", { action: "logout" }); location.href = "/login"; }}>Sign out</button></> : <Link href="/login" className="underline">Guest (demo) — Sign in</Link>}</div></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-black/30 px-4 py-2.5 backdrop-blur-xl">
        <nav className="flex gap-1 overflow-x-auto md:hidden">{NAV.map(([k, l]) => <Link key={k} href={`/app/${k}`} className={`chip whitespace-nowrap ${p?.startsWith(`/app/${k}`) ? "chip-on" : ""}`}>{l}</Link>)}</nav>
        <div className="hidden text-sm text-white/50 md:block">{w?.name}</div>
        <div className="ml-auto flex items-center gap-2">
          <select className="inp !w-auto !py-1 text-xs" value={vendor} onChange={(e) => setVendor(e.target.value)} aria-label="Vendor"><option value="all">All vendors</option>{w?.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <Translate compact /></div></header>
      <main className="min-w-0 flex-1 p-4 md:p-6">{w ? children : <Orbit label="Syncing workspace" />}</main></div>
    <Toast /></div>;
}
export default function L({ children }: { children: React.ReactNode }) { return <DataProvider><Shell>{children}</Shell></DataProvider>; }
