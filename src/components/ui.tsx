"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Portal tooltip: rendered to <body> with fixed positioning → never clipped by overflow panels.
export function Tip({ text, children, side = "top" }: { text: ReactNode; children: ReactNode; side?: "top" | "bottom" | "right" }) {
  const ref = useRef<HTMLSpanElement>(null); const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = () => { const r = ref.current?.getBoundingClientRect(); if (!r) return; setPos(side === "right" ? { x: r.right + 8, y: r.top + r.height / 2 } : { x: r.left + r.width / 2, y: side === "top" ? r.top - 8 : r.bottom + 8 }); };
  return <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)} className="inline-flex">{children}
    {pos && typeof document !== "undefined" && createPortal(<motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: "fixed", left: Math.min(pos.x, window.innerWidth - 20), top: pos.y, transform: side === "right" ? "translateY(-50%)" : side === "top" ? "translate(-50%,-100%)" : "translateX(-50%)", zIndex: 9999 }}
      className="pointer-events-none max-w-xs rounded-lg border border-[#39ff88]/40 bg-[#07110d]/95 px-2.5 py-1.5 text-xs text-[#d8ffe9] shadow-[0_0_24px_-6px_rgba(57,255,136,.6)] backdrop-blur">{text}</motion.div>, document.body)}</span>;
}
export const Chevron = ({ dir = "right", open = false, size = 14 }: { dir?: "right" | "down" | "left"; open?: boolean; size?: number }) =>
  <svg className={`chev ${dir === "down" ? "chev-down" : ""} ${open ? "chev-open" : ""}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={dir === "left" ? { transform: "scaleX(-1)" } : dir === "down" ? { rotate: "90deg" } : undefined}><path d="M9 6l6 6-6 6" /></svg>;
export const Orbit = ({ label }: { label?: string }) => <div className="flex flex-col items-center gap-4 py-16"><div className="orbit"><i /></div>{label && <div className="text-xs tracking-[.3em] uppercase text-[#39ff88]/80">{label}</div>}</div>;
export const Dots = () => <span className="dots"><span /><span /><span /></span>;
export const Skel = ({ h = 16, w = "100%", className = "" }: { h?: number; w?: number | string; className?: string }) => <div className="skel" style={{ height: h, width: w }} />;
export function Card({ title, right, children, className = "" }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`glass p-4 ${className}`}>{(title || right) && <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">{title}</h3>{right}</div>}{children}</section>;
}
export function Stat({ label, value, sub, tip }: { label: string; value: ReactNode; sub?: ReactNode; tip?: string }) {
  const body = <div className="glass p-4 w-full"><div className="label">{label}</div><div className="mt-1 text-2xl font-bold neon">{value}</div>{sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}</div>;
  return tip ? <Tip text={tip} side="bottom">{body}</Tip> : body;
}
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[500] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
    <motion.div onMouseDown={(e) => e.stopPropagation()} initial={{ y: 20, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, opacity: 0 }} className={`glass glass-hi max-h-[88vh] w-full overflow-auto scroll-thin bg-[#07100c]/90 p-5 ${wide ? "max-w-4xl" : "max-w-lg"}`}>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="text-white/50 hover:text-white">✕</button></div>{children}</motion.div></motion.div>}</AnimatePresence>;
}
export function Toast() { const [m, setM] = useState<{ t: string; k: number } | null>(null);
  useEffect(() => { const h = (e: Event) => { setM({ t: (e as CustomEvent).detail, k: Date.now() }); setTimeout(() => setM(null), 3800); }; addEventListener("sc-toast", h); return () => removeEventListener("sc-toast", h); }, []);
  return <AnimatePresence>{m && <motion.div key={m.k} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-5 right-5 z-[9999] glass glass-hi bg-[#07100c]/95 px-4 py-3 text-sm max-w-sm">{m.t}</motion.div>}</AnimatePresence>; }
export const toast = (t: string) => dispatchEvent(new CustomEvent("sc-toast", { detail: t }));
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1"><span className="label">{label}</span>{children}</label>; }
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-sm"><span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-[#39ff88] shadow-[0_0_12px_#39ff88]" : "bg-white/15"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-all ${on ? "left-[18px]" : "left-0.5"}`} /></span>{label}</button>;
}
export const PageHead = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) =>
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{sub && <p className="text-sm text-white/55 mt-1">{sub}</p>}</div><div className="flex flex-wrap gap-2">{right}</div></div>;
export const money = (n: number, c: string = "NGN") => `${c === "NGN" ? "₦" : "$"}${Math.round(n).toLocaleString()}`;
export const ago = (iso?: string) => { if (!iso) return ""; const s = (Date.now() - +new Date(iso)) / 1000; if (s < 0) return "in " + Math.round(-s / 3600) + "h"; if (s < 60) return "now"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.round(s / 3600) + "h"; return Math.round(s / 86400) + "d"; };
