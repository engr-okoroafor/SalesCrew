"use client";
import Link from "next/link";
import { motion } from "framer-motion";
const steps = [
  ["💬", "Inbound autonomy", "Answers WhatsApp, Messenger & IG DMs 24/7 — only to people who message first, only about your services, always with a human handoff."],
  ["🎯", "Outbound leads", "Lead Ads + Page activity + Google, directories & maps → one de-duplicated, scored list."],
  ["✉️", "Muse Spark outreach", "Emails that reference something real about each prospect."],
  ["📞", "Multilingual calls", "Muse Voice Transcribe follows English↔Yoruba code-switching; SeamlessM4T speaks back in each side's language."],
  ["🔁", "Conversions API loop", "meeting_booked & job_won flow back to Meta so ads optimise for revenue, not clicks."],
  ["🌐", "Page → website", "Muse Code-style one-page site built from your Page photos, reviews and posts."],
];
export default function Home() {
  return (
    <main className="grid-bg min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <span className="text-xl font-black">Sales<span className="neon">Crew</span></span>
        <Link href="/demo" className="btn">Open live demo →</Link>
      </nav>
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-10 text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-sm tracking-widest text-emerald-300/80">META GLOBAL AI DEVELOPER HACKATHON · INDIE DEV · BUILD FOR YOUR WORLD</motion.p>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black leading-tight md:text-6xl">
          An AI sales crew for the <span className="neon">small business</span> that can&apos;t afford one.
        </motion.h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">It finds prospects, cleans the data, writes the outreach, calls the ones who reply in their language, books the meeting, answers your DMs at 11pm — and builds the page that closes the deal.</p>
        <div className="mt-8 flex justify-center gap-3"><Link href="/demo" className="btn">Try it — Amaka&apos;s Oven, Port Harcourt</Link><a className="btn-ghost" href="https://github.com/hildanonyelum-cell/SalesCrew">GitHub</a></div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
        {steps.map(([i, t, d], k) => (
          <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }} className="glass p-5">
            <div className="text-3xl">{i}</div><h3 className="mt-2 text-lg font-bold neon">{t}</h3><p className="mt-1 text-sm text-slate-300">{d}</p>
          </motion.div>))}
      </section>
      <section className="mx-auto max-w-4xl px-5 pb-20"><div className="glass p-6 text-sm text-slate-300">
        <b className="neon">Built on the allowed side of Meta&apos;s 2026 messaging rules.</b> SalesCrew is a task-specific customer-service & booking agent — not an open-ended assistant. It never initiates DMs, refuses off-topic requests, and offers a human on every thread.
        <div className="mt-3 text-xs text-slate-400">Models: Meta Muse Spark 1.3 (primary, Meta Model API) · NVIDIA Nemotron 3.5 (fallback) · Muse Voice Transcribe · SeamlessM4T. Built by Hilda Okoronkwo, Port Harcourt 🇳🇬</div>
      </div></section>
    </main>
  );
}
