import { complete, prefer } from "@/lib/ai";
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { parseJSON, imageUrl } from "@/lib/json";
import { memoryFor, remember, audit } from "@/lib/pipeline";
import { generateSite } from "@/lib/sitegen";
import { uid, type Lead, type Product } from "@/lib/schema";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
const money = (p: Product) => `${p.currency === "NGN" ? "₦" : "$"}${p.price.toLocaleString()}`;
function upsellFor(lead: Lead, prods: Product[]) { const mine = prods.filter((p) => lead.productIds.includes(p.id)); const tags = new Set(mine.flatMap((p) => p.tags).concat(lead.interests.join(" ").toLowerCase().split(/\W+/)));
  return prods.filter((p) => !lead.productIds.includes(p.id)).map((p) => ({ p, s: p.tags.filter((t) => tags.has(t)).length + (p.kind !== mine[0]?.kind ? 0.5 : 0) })).sort((a, b) => b.s - a.s).slice(0, 2).map((x) => x.p); }

export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w = await loadWorkspace(ws); const pv = prefer(b.provider ?? w.settings.ai.primary);
  switch (b.task) {
    case "outreach": {
      const leads = w.leads.filter((l) => (b.leadIds ?? []).includes(l.id)).slice(0, 25);
      const out = await Promise.all(leads.map(async (l) => {
        const v = w.vendors.find((x) => x.id === l.vendorId)!; const prods = w.products.filter((p) => p.vendorId === v.id);
        const main = prods.filter((p) => l.productIds.includes(p.id)); const ups = upsellFor(l, prods);
        const r = await complete([{ role: "system", content: `You write ${b.channel === "email" ? "a short sales email (Subject line first as 'Subject: ...')" : `a short ${b.channel} message (max 60 words, no subject)`} for ${v.name}. Personalise with the lead's first name, business and a real detail from the note. Detect intent: which product(s) they want. Add ONE natural upsell from the suggestions. Tone: ${b.tone ?? "warm, professional"}. Goal: ${b.goal ?? "book a call or close the sale"}. Language code: ${b.lang ?? l.lang ?? "en"} (en=English, pcm=Nigerian Pidgin, ig=Igbo, yo=Yoruba, ha=Hausa). Sign as ${v.name}. ${w.settings.outreach.signature}` },
          { role: "user", content: JSON.stringify({ lead: { name: l.name, business: l.company, email: l.email, segment: l.segment, type: l.customerType, note: l.note, interests: l.interests }, wants: main.map((p) => `${p.name} ${money(p)}`), upsell: ups.map((p) => `${p.name} ${money(p)}`), memory: memoryFor(w, l.id) }) }],
          { max: 400, prefer: pv, offline: `${b.channel === "email" ? `Subject: ${l.company || l.name}, a quick idea from ${v.name}\n\n` : ""}Hi ${l.name.split(" ")[0]}, thanks for your interest${main[0] ? ` in our ${main[0].name}` : ""}${l.company ? ` for ${l.company}` : ""}. ${ups[0] ? `Many clients also add our ${ups[0].name} (${money(ups[0])}). ` : ""}Can I book you a quick call this week? — ${v.name}` });
        let subject: string | undefined; let body = r.text; const m = body.match(/^\s*Subject:\s*(.+)\n+/i); if (m) { subject = m[1].trim(); body = body.slice(m[0].length).trim(); }
        return { leadId: l.id, name: l.name, subject, body, intent: main.map((p) => p.name), upsell: ups.map((p) => p.name), provider: r.provider, model: r.model, fallback: r.fallback };
      }));
      return Response.json({ drafts: out });
    }
    case "post": {
      const v = w.vendors.find((x) => x.id === b.vendorId) ?? w.vendors[0]; const prods = w.products.filter((p) => (b.productIds ?? []).includes(p.id));
      const r = await complete([{ role: "system", content: `You are Meta-AI social copywriter for ${v.name} (${v.industry}, ${v.city}). Return JSON {"variants":[{"text":"post copy with emojis + CTA + 2-4 hashtags","imagePrompt":"photoreal image description"}]} with 3 variants tailored to: ${b.audience ?? "the vendor's customers"}. Channel targets: ${(b.targets ?? []).join(", ")}. Language: ${b.lang ?? "en"}.` },
        { role: "user", content: `Brief: ${b.brief ?? "promote best sellers"}. Products: ${prods.map((p) => `${p.name} ${money(p)} — ${p.desc}`).join("; ") || "catalog best sellers"}` }], { max: 700, prefer: pv,
        offline: JSON.stringify({ variants: [{ text: `✨ ${prods[0]?.name ?? v.name} — now booking! DM us on WhatsApp to order today. #${v.city.split(",")[0].replace(/\s/g, "")} #SmallBusiness`, imagePrompt: `${prods[0]?.name ?? v.industry} product photo, studio light, vibrant, ${v.city}` }] }) });
      const j = parseJSON<{ variants: { text: string; imagePrompt: string }[] }>(r.text, { variants: [{ text: r.text, imagePrompt: `${v.industry} promo photo` }] });
      return Response.json({ variants: j.variants.slice(0, 3).map((x, i) => ({ ...x, image: imageUrl(x.imagePrompt, i + 7) })), provider: r.provider, model: r.model, fallback: r.fallback });
    }
    case "nba": {
      const open = w.leads.filter((l) => !["paid", "lost"].includes(l.stage)).sort((a, b) => b.score * b.value - a.score * a.value).slice(0, 15);
      const paid = w.leads.filter((l) => l.stage === "paid" || l.stage === "nurture").slice(0, 8);
      const r = await complete([{ role: "system", content: `You are a sales strategist. Given unclosed leads, paid customers, campaigns and memory, return JSON {"summary":"2 sentences on pipeline health","actions":[{"leadId":"id or null","title":"imperative short","why":"reason","channel":"whatsapp|messenger|instagram|email|voice","urgency":"high|med|low","play":"close|follow-up|upsell|nurture|reactivate|campaign"}]} with 6 actions max, prioritised by revenue x likelihood. Include at least one post-sale nurture/upsell and one targeted campaign idea.` },
        { role: "user", content: JSON.stringify({ open: open.map((l) => ({ id: l.id, name: l.name, stage: l.stage, score: l.score, value: l.value, channel: l.channel, segment: l.segment, last: l.lastTouch, note: l.note, mem: memoryFor(w, l.id) })), paid: paid.map((l) => ({ id: l.id, name: l.name, note: l.note })), campaigns: w.campaigns.map((c) => ({ name: c.name, leads: c.leads, revenue: c.revenue, status: c.status })) }) }],
        { max: 900, prefer: pv, offline: JSON.stringify({ summary: `${open.length} open leads worth ${open.reduce((s, l) => s + l.value, 0).toLocaleString()}. Prioritise qualified/proposal stages.`, actions: open.slice(0, 5).map((l) => ({ leadId: l.id, title: `${l.stage === "proposal" ? "Close" : "Follow up with"} ${l.name}`, why: l.note, channel: l.channel, urgency: l.score > 75 ? "high" : "med", play: l.stage === "proposal" ? "close" : "follow-up" })) }) });
      return Response.json({ ...parseJSON(r.text, { summary: r.text, actions: [] }), provider: r.provider, model: r.model, fallback: r.fallback });
    }
    case "leadgen": {
      const v = w.vendors.find((x) => x.id === b.vendorId) ?? w.vendors[0]; const icp = b.icp ?? {};
      const r = await complete([{ role: "system", content: `You are a B2B/B2C prospecting researcher. Return JSON {"leads":[{"name","company","email","phone","segment","customerType":"B2B|B2C|Reseller|Government|NGO","interests":["..."],"note":"why they fit + where to find them","source":"where (Maps, LinkedIn, IG hashtag, directory, FB group)"}]}. Use realistic but clearly prospect-profile style entries (emails as role@domain guesses). Count: ${Math.min(Number(icp.count ?? 6), 12)}.` },
        { role: "user", content: JSON.stringify({ vendor: v.name, industry: v.industry, city: icp.city ?? v.city, customerTypes: icp.customerTypes, segments: icp.segments, products: w.products.filter((p) => (icp.productIds ?? []).includes(p.id)).map((p) => p.name), extra: icp.notes }) }], { max: 1200, prefer: pv, offline: JSON.stringify({ leads: [] }) });
      const j = parseJSON<{ leads: Partial<Lead>[] }>(r.text, { leads: [] });
      return Response.json({ leads: (j.leads ?? []).map((l) => ({ ...l, id: uid("l"), vendorId: v.id, channel: l.email ? "email" : "whatsapp", productIds: icp.productIds ?? [], stage: "new", score: 0, value: 0, lang: "en", createdAt: new Date().toISOString(), tags: ["ai-prospect", "verify"], interests: l.interests ?? [] })), provider: r.provider, model: r.model, fallback: r.fallback });
    }
    case "translate": {
      const texts: string[] = (b.texts ?? []).slice(0, 120);
      const r = await complete([{ role: "system", content: `Translate each string in the JSON array to language "${b.lang}". Keep emojis, numbers, currency and brand names (SalesCrew, WhatsApp, Messenger, Instagram, Meta). Return ONLY a JSON array of the same length.` }, { role: "user", content: JSON.stringify(texts) }], { max: 3000, prefer: pv, offline: JSON.stringify(texts) });
      const arr = parseJSON<string[]>(r.text, texts); return Response.json({ texts: Array.isArray(arr) && arr.length === texts.length ? arr : texts, provider: r.provider });
    }
    case "site": {
      const r = await generateSite(w, b, pv);
      await mutate(ws, (w2) => { const i = w2.sites.findIndex((s) => s.id === r.site.id); if (i >= 0) w2.sites[i] = r.site; else w2.sites.unshift(r.site); audit(w2, "ai", "site.generate", r.site.name); });
      return Response.json(r);
    }
    case "memory": {
      const l = w.leads.find((x) => x.id === b.leadId); if (!l) return Response.json({ ok: false });
      const conv = w.conversations.filter((c) => c.leadId === l.id).flatMap((c) => c.messages.slice(-15).map((m) => `${m.from}: ${m.text}`)).join("\n");
      const r = await complete([{ role: "system", content: `Extract durable sales memory. Return JSON {"long":["facts/preferences worth remembering for months"],"short":["immediate objections/promises for next 72h"]}` }, { role: "user", content: `Lead: ${l.name} ${l.company} ${l.note}\n${conv}` }], { max: 400, prefer: pv, offline: JSON.stringify({ long: [`${l.name}: ${l.note}`], short: [] }) });
      const j = parseJSON<{ long: string[]; short: string[] }>(r.text, { long: [], short: [] });
      const nw = await mutate(ws, (w2) => { (j.long ?? []).forEach((t) => remember(w2, l.vendorId, l.id, "fact", t, "long")); (j.short ?? []).forEach((t) => remember(w2, l.vendorId, l.id, "promise", t, "short")); });
      return Response.json({ ok: true, memory: nw.memory.filter((m) => m.leadId === l.id) });
    }
    default: { const r = await complete([{ role: "user", content: String(b.prompt ?? "") }], { max: 500, prefer: pv }); return Response.json(r); }
  }
}
