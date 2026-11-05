"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Chevron, Dots } from "@/components/ui";
export default function Login() {
  const r = useRouter(); const [mode, setMode] = useState<"login" | "signup">("login"); const [f, setF] = useState({ name: "", company: "", email: "", password: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(""); const j = await (await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, ...f }) })).json(); setBusy(false); if (j.ok) r.push("/app/inbox"); else setErr(j.error); };
  return <main className="grid min-h-screen place-items-center p-6"><motion.form onSubmit={go} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass glass-hi w-full max-w-sm space-y-3 p-7">
    <Link href="/" className="text-xl font-bold"><span className="text-[#39ff88]">Sales</span>Crew</Link><div className="flex rounded-xl bg-black/30 p-0.5">{(["login", "signup"] as const).map((m) => <button type="button" key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg py-1.5 text-sm ${mode === m ? "bg-[#39ff88] text-black" : "text-white/60"}`}>{m === "login" ? "Sign in" : "Create workspace"}</button>)}</div>
    {mode === "signup" && <><input className="inp" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><input className="inp" placeholder="Business name" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></>}
    <input className="inp" type="email" required placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><input className="inp" type="password" required minLength={8} placeholder="Password (8+ chars)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
    {err && <p className="text-sm text-red-300">{err}</p>}<button className="btn w-full justify-center" disabled={busy}>{busy ? <Dots /> : <>{mode === "login" ? "Sign in" : "Create free workspace"} <Chevron /></>}</button>
    <Link href="/app/inbox" className="chev-host block text-center text-xs text-white/50 hover:text-[#39ff88]">Explore the live demo workspace <Chevron size={10} /></Link></motion.form></main>;
}
