"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { HERO, SERVICES, GALLERY } from "@/lib/photos";
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from "@/components/icons/ChannelIcons";
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
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <span className="text-xl font-black">Sales<span className="neon">Crew</span></span>
        <Link href="/app/inbox" className="btn">Open live demo →</Link><Link href="/login" className="btn-ghost">Sign in</Link>
      </nav>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pt-10 pb-10 md:grid-cols-2">
        <div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-xs tracking-widest text-emerald-300/80">META GLOBAL AI DEVELOPER HACKATHON · INDIE DEV · BUILD FOR YOUR WORLD</motion.p>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black leading-tight md:text-5xl">
          An AI sales crew for the <span className="neon">small business</span> that can&apos;t afford one.
        </motion.h1>
        <p className="mt-6 text-lg text-slate-300">It finds prospects, cleans the data, writes the outreach, calls the ones who reply in their language, books the meeting, answers your DMs at 11pm — and builds the page that closes the deal.</p>
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-300"><span className="tip" data-tip="WhatsApp Cloud API"><WhatsAppIcon size={30} /></span><span className="tip" data-tip="Messenger Platform"><MessengerIcon size={30} /></span><span className="tip" data-tip="Instagram Messaging"><InstagramIcon size={30} /></span> answers all three inboxes</div>
        <div className="mt-8 flex gap-3"><Link href="/app/inbox" className="btn">Try it — Amaka&apos;s Oven, Port Harcourt</Link><a className="btn-ghost" href="https://github.com/hildanonyelum-cell/SalesCrew">GitHub</a></div>
        </div>
        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="glass relative overflow-hidden p-2">
          <img src={HERO} alt="Chocolate celebration cake from Amaka's Oven" className="h-[380px] w-full rounded-xl object-cover" />
          <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-black/70 p-3 text-sm backdrop-blur"><div className="flex items-center gap-2"><WhatsAppIcon size={18} /><b>Customer · 11:04 PM</b></div><p className="mt-1 text-slate-200">Can I get a 6-inch chocolate cake for Saturday? 🎂</p><p className="mt-2 neon">SalesCrew: Yes! ₦25,000 — Sat 09:00 or 12:00 pickup?</p></div>
        </motion.div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-12"><h2 className="mb-4 text-2xl font-black">What Amaka&apos;s Oven &amp; Events sells — and SalesCrew answers for</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{SERVICES.map((v, k) => (
          <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }} whileHover={{ y: -4 }} className="glass tip overflow-hidden" data-tip={v.tip}>
            <img src={v.img} alt={v.title} loading="lazy" className="h-36 w-full object-cover" /><div className="p-3"><h3 className="font-bold neon">{v.title}</h3><p className="mt-1 text-xs text-slate-300">{v.desc}</p></div>
          </motion.div>))}</div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
        {steps.map(([i, t, d], k) => (
          <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }} className="glass p-5">
            <div className="text-3xl">{i}</div><h3 className="mt-2 text-lg font-bold neon">{t}</h3><p className="mt-1 text-sm text-slate-300">{d}</p>
          </motion.div>))}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-12"><h2 className="mb-4 text-2xl font-black">From the oven &amp; the events floor</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{GALLERY.map((g, k) => <motion.img key={g} src={g} alt="Amaka's Oven gallery" loading="lazy" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: k * 0.05 }} className="h-32 w-full rounded-xl object-cover ring-1 ring-emerald-400/20" />)}</div>
      </section>
      <section className="mx-auto max-w-4xl px-5 pb-20"><div className="glass p-6 text-sm text-slate-300">
        <b className="neon">Built on the allowed side of Meta&apos;s 2026 messaging rules.</b> SalesCrew is a task-specific customer-service & booking agent — not an open-ended assistant. It never initiates DMs, refuses off-topic requests, and offers a human on every thread.
        <div className="mt-3 text-xs text-slate-400">Models: Meta Muse Spark 1.3 (primary, Meta Model API) · NVIDIA Nemotron 3.5 (fallback) · Muse Voice Transcribe · SeamlessM4T. Built by Hilda Okoronkwo, Port Harcourt 🇳🇬</div>
      </div></section>
    </main>
  );
}
