import { complete, prefer } from "@/lib/ai";
import { BUSINESS } from "@/lib/data";
export const maxDuration = 60;
export async function POST(req: Request) {
  const { lead, provider } = await req.json();
  const r = await complete([
    { role: "system", content: `You write short B2B outreach emails for ${BUSINESS.name} (${BUSINESS.city}). Services: ${BUSINESS.services.map((s) => s.name).join(", ")}. Reference ONE specific real detail from the prospect notes in the first line. Max 110 words. Include a subject line as 'Subject: ...'. One clear CTA to book a 15-min tasting call. No hype, no fake claims. Sign off as Amaka.` },
    { role: "user", content: `Prospect: ${lead?.name} at ${lead?.company}. Source: ${lead?.source}. Notes (verified): ${lead?.note}` },
  ], { max: 400, prefer: prefer(provider), offline: `Subject: Cakes for your December weddings\n\nHi ${lead?.name},\n\nSaw your note about ${lead?.note}. We bake for PH weddings weekly. Free tasting call this week?\n\n— Amaka` });
  return Response.json(r);
}
