import { complete, prefer } from "@/lib/ai";
import { BUSINESS } from "@/lib/data";
export const maxDuration = 60;
const PAGE = { posts: ["Red velvet 3-tier for the Ikwerre Road wedding ❤️", "Small chops Friday special — 50 pcs ₦35k", "Behind the scenes: 5am in the oven room"], reviews: ["“Best cake in PH, delivered on time to Woji” — Ebi", "“Our office party was a hit” — Trans-Amadi HR"], photos: ["red-velvet.jpg", "small-chops.jpg", "team.jpg"] };
export async function POST(req: Request) {
  const { provider } = await req.json().catch(() => ({}));
  const r = await complete([
    { role: "system", content: "You generate a single self-contained HTML landing page (inline <style>, no scripts, no external assets). Mobile-first, warm colours. Sections: hero with CTA 'Book on WhatsApp', services with prices, reviews, gallery placeholders (coloured divs labelled with photo names), footer. Output ONLY the HTML, no markdown fences. Under 3500 characters." },
    { role: "user", content: `Business: ${BUSINESS.name}, ${BUSINESS.city}. Services: ${BUSINESS.services.map((s) => `${s.name} ₦${s.price.toLocaleString()}`).join("; ")}. Page posts: ${PAGE.posts.join(" | ")}. Reviews: ${PAGE.reviews.join(" | ")}. Photos: ${PAGE.photos.join(", ")}. Hours: ${BUSINESS.hours}.` },
  ], { max: 2000, prefer: prefer(provider), offline: `<html><body style="font-family:sans-serif;padding:24px"><h1>${BUSINESS.name}</h1><p>Cakes & small chops in Port Harcourt.</p></body></html>` });
  const html = r.text.replace(/^```html?\s*/i, "").replace(/```\s*$/, "");
  return Response.json({ ...r, text: undefined, html, source: PAGE });
}
