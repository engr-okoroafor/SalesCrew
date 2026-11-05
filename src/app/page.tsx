"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { HERO, LOGO, SERVICES, GALLERY } from "@/lib/photos";
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from "@/components/icons/ChannelIcons";
const steps = [
  ["💬", "Inbound autonomy", "Answers WhatsApp, Messenger & IG DMs 24/7 — only to people who message first, only about your services, always with a human handoff."],
  ["🎯", "Outbound leads", "Lead Ads + Page activity + Google, directories & maps → one de-duplicated, scored list."],
  ["✉️", "Muse Spark outreach", "Emails that reference something real about each prospect."],
  ["📞", "Multilingual calls", "Muse Voice Transcribe follows English↔Yoruba code-switching; SeamlessM4T speaks back in each side's language."],
  ["🔁", "Conversions API loop", "meeting_booked & job_won flow back to Meta so ads optimise for revenue, not clicks."],
  ["🌐", "Page → website", "Muse Code-style one-page site built from your Page photos, reviews and posts."],
];
const SITE = "https://salescrew.vercel.app";
const LD = [
  { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE}#org`, name: "SalesCrew", url: SITE, logo: `${SITE}/photos/hero-cake.jpg`, description: "Multi-vendor AI sales crew and marketplace: list many businesses and services, answer WhatsApp, Messenger and Instagram 24/7.", sameAs: ["https://github.com/hildanonyelum-cell/SalesCrew"] },
  { "@context": "https://schema.org", "@type": ["LocalBusiness", "Bakery"], "@id": `${SITE}#rise-and-eat`, name: "Rise & Eat", image: `${SITE}/brand/rise-and-eat-logo.jpg`, url: SITE, telephone: "+2347063356787", email: "riseandeat@gmail.com", priceRange: "₦₦", servesCuisine: "Nigerian, cakes, catering, small chops",
    address: { "@type": "PostalAddress", streetAddress: "GRA Phase 2", addressLocality: "Port Harcourt", addressRegion: "Rivers", postalCode: "500272", addressCountry: "NG" }, geo: { "@type": "GeoCoordinates", latitude: 4.8156, longitude: 7.0498 },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "19:00" }], areaServed: "Port Harcourt", parentOrganization: { "@id": `${SITE}#org` },
    hasOfferCatalog: { "@type": "OfferCatalog", name: "Rise & Eat services", itemListElement: SERVICES.map((v) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: v.title, description: v.desc } })) } },
  { "@context": "https://schema.org", "@type": "WebSite", url: SITE, name: "SalesCrew", publisher: { "@id": `${SITE}#org` } },
];
const VERTICALS = [["🍰", "Food & bakeries"], ["💇🏾", "Salons & beauty"], ["🔧", "Repairs & trades"], ["🏥", "Clinics"], ["🎉", "Events & venues"], ["🛍", "Retail shops"], ["🏠", "Real estate"], ["📚", "Tutors & schools"]];
export default function Home() {
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <span className="text-xl font-black">Sales<span className="neon">Crew</span></span>
        <Link href="/app/inbox" className="btn">Open live demo →</Link><Link href="/login" className="btn-ghost">Sign in</Link>
      </nav>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pt-10 pb-10 md:grid-cols-2">
        <div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-xs tracking-widest text-emerald-300/80">META GLOBAL AI DEVELOPER HACKATHON · INDIE DEV · BUILD FOR YOUR WORLD</motion.p>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black leading-tight md:text-5xl">
          List every business &amp; service you run. <span className="neon">One AI sales crew</span> sells them all.
        </motion.h1>
        <p className="mt-6 text-lg text-slate-300">SalesCrew is a multi-vendor marketplace and AI sales team: add as many businesses, branches and services as you like — each gets its own catalog, inbox, channels and website. It finds prospects, cleans the data, writes the outreach, calls the ones who reply in their language, books the meeting, answers your DMs at 11pm — and builds the page that closes the deal.</p>
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-300"><span className="tip" data-tip="WhatsApp Cloud API"><WhatsAppIcon size={30} /></span><span className="tip" data-tip="Messenger Platform"><MessengerIcon size={30} /></span><span className="tip" data-tip="Instagram Messaging"><InstagramIcon size={30} /></span> answers all three inboxes</div>
        <div className="mt-8 flex gap-3"><Link href="/app/inbox" className="btn">Try it — Rise &amp; Eat, Port Harcourt</Link><a className="btn-ghost" href="https://github.com/hildanonyelum-cell/SalesCrew">GitHub</a></div>
        </div>
        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="glass relative overflow-hidden p-2">
          <img src={HERO} alt="Cakes for all events from the Rise & Eat services board" className="h-[380px] w-full rounded-xl object-cover" />
          <img src={LOGO} alt="Rise & Eat" className="absolute left-5 top-5 h-16 w-16 rounded-full object-cover ring-2 ring-[#c6a15b]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-black/70 p-3 text-sm backdrop-blur"><div className="flex items-center gap-2"><WhatsAppIcon size={18} /><b>Customer · 11:04 PM</b></div><p className="mt-1 text-slate-200">Can I get a 6-inch chocolate cake for Saturday? 🎂</p><p className="mt-2 neon">Rise & Eat: Saturday works. That cake isn’t priced on our board — I’ll quote it from similar Nigerian bakeries and confirm.</p></div>
        </motion.div>
      </section>
      <section aria-labelledby="multi" className="mx-auto max-w-6xl px-5 pb-12"><h2 id="multi" className="mb-2 text-2xl font-black">One account. <span className="neon">Many businesses &amp; services.</span></h2>
        <p className="mb-4 max-w-3xl text-slate-300">Run a bakery, a salon and a repair shop? List them all. Each vendor gets its own products, prices, WhatsApp/Messenger/Instagram numbers, AI persona, Google-ready listing page and payments — routed automatically.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{VERTICALS.map(([i, t]) => <div key={t} className="glass flex items-center gap-3 p-4"><span className="text-2xl" aria-hidden>{i}</span><h3 className="font-bold">{t}</h3></div>)}</div>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/login" className="btn">List your business free →</Link><Link href="/app/admin" className="btn-ghost">Add more vendors</Link></div>
      </section>
      <section aria-labelledby="featured" className="mx-auto max-w-6xl px-5 pb-12"><div className="mb-3 flex items-center gap-3"><img src={LOGO} alt="Rise & Eat logo" className="h-16 w-16 rounded-full object-cover ring-2 ring-[#c6a15b]" /><h2 id="featured" className="text-2xl font-black">Featured vendor: Rise &amp; Eat — nourishing lives, celebrating every moment</h2></div>
        <address className="mb-3 text-sm not-italic text-slate-400">Rise &amp; Eat · Port Harcourt · Menu board 0706 335 6787 · riseandeat@gmail.com · WhatsApp Business 0907 408 7284</address>
        <div className="mb-4 flex flex-wrap gap-2 text-sm"><a className="btn-ghost" href="https://wa.me/2349074087284">Test WhatsApp</a><a className="btn-ghost" href="https://wa.me/2347063356787">Menu-board WhatsApp</a><a className="btn-ghost" href="https://m.me/61558190371192">Messenger · Rise &amp; Eat</a><a className="btn-ghost" href="https://ig.me/m/chukwudifu.okoroafor">Instagram</a></div>
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
      <section className="mx-auto max-w-6xl px-5 pb-12"><h2 className="mb-4 text-2xl font-black">From the Rise &amp; Eat oven &amp; events floor</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{GALLERY.map((g, k) => <motion.img key={g} src={g} alt="Rise & Eat cakes and events gallery, Port Harcourt" loading="lazy" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: k * 0.05 }} className="h-32 w-full rounded-xl object-cover ring-1 ring-emerald-400/20" />)}</div>
      </section>
      <section className="mx-auto max-w-4xl px-5 pb-20"><div className="glass p-6 text-sm text-slate-300">
        <b className="neon">Built on the allowed side of Meta&apos;s 2026 messaging rules.</b> SalesCrew is a task-specific customer-service & booking agent — not an open-ended assistant. It never initiates DMs, refuses off-topic requests, and offers a human on every thread.
        <div className="mt-3 text-xs text-slate-400">Models: Meta Muse Spark 1.3 (primary, Meta Model API) · NVIDIA Nemotron 3.5 (fallback) · Muse Voice Transcribe · SeamlessM4T. Built by Hilda Okoronkwo, Port Harcourt 🇳🇬</div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"><Link href="/privacy" className="underline decoration-emerald-400/40">Privacy Policy</Link><Link href="/terms" className="underline decoration-emerald-400/40">Terms of Use</Link><Link href="/data-deletion" className="underline decoration-emerald-400/40">Data deletion</Link></div>
      </div></section>
    </main>
  );
}
