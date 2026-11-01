"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/icons/Futur";
import type { Workspace } from "@/lib/schema";
import { useData, inVendor, upload } from "@/lib/client/data";
import { Field, Modal, PageHead, money, toast, Dots, Tip } from "@/components/ui";
import { uid, type Product } from "@/lib/schema";
export default function Products() {
  const { w, vendor, save, del } = useData(); const [e, setE] = useState<Product | null>(null); const [kind, setKind] = useState("all"); const [busy, setBusy] = useState(false); const fr = useRef<HTMLInputElement>(null);
  if (!w) return null; const vid = vendor === "all" ? w.vendors[0].id : vendor;
  const list = w.products.filter(inVendor(vendor)).filter((p) => kind === "all" || p.kind === kind); const cats = [...new Set(list.map((p) => p.category))];
  return <div><PageHead title="Products & services" sub="Catalog the AI sells from — prices, photos, videos, stock and lead times per vendor." right={<><div className="flex gap-1">{["all", "good", "service"].map((k) => <button key={k} onClick={() => setKind(k)} className={`chip ${kind === k ? "chip-on" : ""}`}>{k === "all" ? "All" : k === "good" ? "Goods" : "Services"}</button>)}</div>
    <button className="btn" onClick={() => setE({ id: uid("p"), vendorId: vid, kind: "good", name: "", category: "", price: 0, currency: w.vendors.find((v) => v.id === vid)?.currency ?? "NGN", desc: "", media: [], tags: [] })}>+ Add product</button></>} />
    {cats.map((c) => <section key={c} className="mb-6"><div className="label mb-2">{c}</div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{list.filter((p) => p.category === c).map((p) => <div role="button" tabIndex={0} key={p.id} onClick={() => setE(p)} className="group glass cursor-pointer overflow-hidden text-left transition hover:glass-hi hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] bg-white/5"><Carousel media={p.media} kind={p.kind} name={p.name} /><span className="chip pointer-events-none absolute left-2 top-2 bg-black/60">{p.kind}</span></div>
      <div className="p-3"><div className="font-medium">{p.name}</div><div className="flex justify-between text-sm"><b className="neon">{money(p.price, p.currency)}</b><span className="text-xs text-white/40">{p.stock != null ? `${p.stock} in stock` : p.leadTime}</span></div>
        {(() => { const a = analytics(w, p.id); return <div className="mt-2 flex gap-3 text-[11px] text-white/50"><Tip text="Views (site & catalog)"><span className="inline-flex items-center gap-1"><Icon name="eye" size={12} />{a.views}</span></Tip><Tip text="Interested leads / inquiries"><span className="inline-flex items-center gap-1"><Icon name="comment" size={12} />{a.interested}</span></Tip><Tip text="Paying buyers"><span className="inline-flex items-center gap-1 text-[#39ff88]"><Icon name="check" size={12} />{a.buyers}</span></Tip></div>; })()}</div></div>)}</div></section>)}
    {!list.length && <p className="text-white/40">No products yet.</p>}
    <Modal open={!!e} onClose={() => setE(null)} title={e?.name || "New product"} wide>{e && <div className="grid gap-3 md:grid-cols-3">
      <Field label="Name"><input className="inp" value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} /></Field>
      <Field label="Type"><select className="inp" value={e.kind} onChange={(x) => setE({ ...e, kind: x.target.value as Product["kind"] })}><option value="good">Good</option><option value="service">Service</option></select></Field>
      <Field label="Category"><input className="inp" list="cats" value={e.category} onChange={(x) => setE({ ...e, category: x.target.value })} /><datalist id="cats">{[...new Set(w.products.map((p) => p.category))].map((c) => <option key={c} value={c} />)}</datalist></Field>
      <Field label="Price"><input type="number" className="inp" value={e.price} onChange={(x) => setE({ ...e, price: +x.target.value })} /></Field>
      <Field label="Currency"><select className="inp" value={e.currency} onChange={(x) => setE({ ...e, currency: x.target.value as "NGN" })}><option>NGN</option><option>USD</option></select></Field>
      <Field label="Vendor"><select className="inp" value={e.vendorId} onChange={(x) => setE({ ...e, vendorId: x.target.value })}>{w.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
      <Field label={e.kind === "good" ? "Stock" : "Lead time"}>{e.kind === "good" ? <input type="number" className="inp" value={e.stock ?? 0} onChange={(x) => setE({ ...e, stock: +x.target.value })} /> : <input className="inp" value={e.leadTime ?? ""} onChange={(x) => setE({ ...e, leadTime: x.target.value })} />}</Field>
      <div className="md:col-span-2"><Field label="Tags (comma — used for upsell matching)"><input className="inp" value={e.tags.join(", ")} onChange={(x) => setE({ ...e, tags: x.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field></div>
      <div className="md:col-span-3"><Field label="Description"><textarea className="inp" rows={3} value={e.desc} onChange={(x) => setE({ ...e, desc: x.target.value })} /></Field></div>
      <div className="md:col-span-3"><div className="label mb-1">Photos & videos</div><div className="flex flex-wrap gap-2">{e.media.map((m, i) => <div key={i} className="relative">{m.type === "video" ? <video src={m.url} className="h-24 rounded-lg" controls /> : <img src={m.url} alt="" className="h-24 rounded-lg" />}<button onClick={() => setE({ ...e, media: e.media.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded bg-black/70 px-1 text-xs">✕</button></div>)}
        <input ref={fr} type="file" hidden multiple accept="image/*,video/*" onChange={async (x) => { if (!x.target.files) return; setBusy(true); const f = await upload(x.target.files); setE({ ...e, media: [...e.media, ...f.map(({ url, type }) => ({ url, type }))] }); setBusy(false); }} />
        <Tip text="Upload JPG/PNG/WebP or MP4 (≤25MB). Stored in your persistent media store."><button onClick={() => fr.current?.click()} className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-[#39ff88]/40 text-[#39ff88]">{busy ? <Dots /> : "+ Upload"}</button></Tip>
        <button className="btn-ghost h-24" onClick={() => setE({ ...e, media: [...e.media, { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(e.name + " " + e.desc + " product photo studio")}?width=800&height=600&nologo=true&seed=${Date.now() % 1000}`, type: "image" }] })}>✨ AI photo</button></div></div>
      {w.products.some((x) => x.id === e.id) && <div className="md:col-span-3"><Analytics w={w} id={e.id} /></div>}
      <div className="flex justify-between md:col-span-3"><button className="text-red-300" onClick={async () => { await del("products", [e.id]); setE(null); }}>Delete</button><button className="btn" disabled={!e.name} onClick={async () => { await save("products", e); setE(null); toast("Saved"); }}>Save</button></div></div>}</Modal></div>;
}

// Buyers & viewers per product: views counter, interested leads, paid buyers (from payments), revenue.
function analytics(w: Workspace, id: string) {
  const p = w.products.find((x) => x.id === id); const paid = w.payments.filter((x) => x.productId === id && x.status === "paid"); const ids = new Set(paid.map((x) => x.leadId).filter(Boolean));
  const leads = w.leads.filter((l) => l.productIds.includes(id)); return { views: p?.views ?? 0, interested: Math.max(leads.length, p?.inquiries ?? 0), buyers: Math.max(ids.size || paid.length, p?.buyers ?? 0), revenue: paid.reduce((a, x) => a + x.amount, 0), leads, buyerLeads: w.leads.filter((l) => ids.has(l.id)) };
}
function Analytics({ w, id }: { w: Workspace; id: string }) {
  const a = analytics(w, id); const p = w.products.find((x) => x.id === id)!; const conv = a.views ? Math.round((a.buyers / a.views) * 1000) / 10 : 0;
  return <div className="rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 p-3"><div className="label mb-2">Buyers & viewers</div>
    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">{[["Views", a.views], ["Interested", a.interested], ["Buyers", a.buyers], ["Conversion", `${conv}%`], ["Revenue", money(a.revenue, p.currency)]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-black/30 p-2"><div className="text-[10px] uppercase text-white/40">{k}</div><b className="neon">{v}</b></div>)}</div>
    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2"><div><div className="text-white/40">Buyers</div>{a.buyerLeads.slice(0, 8).map((l) => <div key={l.id}>✓ {l.name}</div>)}{!a.buyerLeads.length && <div className="text-white/30">None yet</div>}</div>
      <div><div className="text-white/40">Interested leads</div>{a.leads.slice(0, 8).map((l) => <div key={l.id}>• {l.name} <span className="text-white/40">({l.stage})</span></div>)}{!a.leads.length && <div className="text-white/30">None yet</div>}</div></div></div>;
}
// Multi-photo carousel with neon arrows + dots (click arrows without opening the editor).
function Carousel({ media, kind, name }: { media: { url: string; type: "image" | "video" }[]; kind: string; name: string }) {
  const [i, setI] = useState(0); if (!media.length) return <div className="grid h-full place-items-center text-3xl">{kind === "service" ? "🛠" : "📦"}</div>;
  const m = media[i % media.length]; const go = (d: number) => (ev: React.MouseEvent) => { ev.stopPropagation(); setI((i + d + media.length) % media.length); };
  return <div className="relative h-full w-full overflow-hidden"><AnimatePresence mode="wait"><motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .2 }} className="h-full w-full">
    {m.type === "video" ? <video src={m.url} muted className="h-full w-full object-cover" /> : <img src={m.url} alt={name} loading="lazy" className="h-full w-full object-cover" />}</motion.div></AnimatePresence>
    {media.length > 1 && <><button aria-label="Previous photo" onClick={go(-1)} className="absolute left-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[#39ff88]/50 bg-black/60 text-[#39ff88] opacity-0 shadow-[0_0_12px_-3px_#39ff88] transition group-hover:opacity-100"><Icon name="left" size={14} /></button>
      <button aria-label="Next photo" onClick={go(1)} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[#39ff88]/50 bg-black/60 text-[#39ff88] opacity-0 shadow-[0_0_12px_-3px_#39ff88] transition group-hover:opacity-100"><Icon name="right" size={14} /></button>
      <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">{media.map((_, j) => <span key={j} className={`h-1.5 rounded-full transition-all ${j === i % media.length ? "w-4 bg-[#39ff88]" : "w-1.5 bg-white/40"}`} />)}</div></>}</div>;
}
