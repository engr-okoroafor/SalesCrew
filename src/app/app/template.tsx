"use client";
import { motion } from "framer-motion";
export default function T({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: .35, ease: [.2, .8, .2, 1] }}>{children}</motion.div>;
}
