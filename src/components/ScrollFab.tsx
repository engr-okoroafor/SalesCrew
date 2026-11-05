"use client";
// Animated back-to-top / back-to-bottom buttons. Watch the window and the nearest tall scroll container.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { I } from "@/components/icons/Futur";
export default function ScrollFab() {
  const [st, setSt] = useState({ top: false, bottom: false });
  useEffect(() => { const f = () => { const y = scrollY, max = document.documentElement.scrollHeight - innerHeight; setSt({ top: y > 300, bottom: max - y > 300 }); };
    f(); addEventListener("scroll", f, { passive: true }); addEventListener("resize", f); const t = setInterval(f, 1200); return () => { removeEventListener("scroll", f); removeEventListener("resize", f); clearInterval(t); }; }, []);
  const go = (to: "top" | "bottom") => scrollTo({ top: to === "top" ? 0 : document.documentElement.scrollHeight, behavior: "smooth" });
  const B = ({ k }: { k: "top" | "bottom" }) => <motion.button key={k} initial={{ opacity: 0, scale: .6, y: k === "top" ? 10 : -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .6 }} whileHover={{ scale: 1.12 }} whileTap={{ scale: .9 }}
    onClick={() => go(k)} title={k === "top" ? "Back to top" : "Jump to bottom"} aria-label={k === "top" ? "Back to top" : "Jump to bottom"}
    className="grid h-10 w-10 place-items-center rounded-full border border-[#39ff88]/50 bg-black/60 text-[#39ff88] shadow-[0_0_22px_-4px_#39ff88] backdrop-blur-xl">
    <motion.span animate={{ y: k === "top" ? [0, -2, 0] : [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>{k === "top" ? <I.up size={18} /> : <I.down size={18} />}</motion.span></motion.button>;
  return <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2"><AnimatePresence>{st.top && <B k="top" />}{st.bottom && <B k="bottom" />}</AnimatePresence></div>;
}
