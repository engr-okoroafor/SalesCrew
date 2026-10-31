import { complete, prefer } from "@/lib/ai";
export const maxDuration = 60;
// Call lab: diarized, code-switched transcript (Muse Voice Transcribe shape) + translation turn (SeamlessM4T-style S2ST, text simulated).
const TRANSCRIPT = [
  { speaker: "S1 · SalesCrew", lang: "en", text: "Good afternoon Mr. Okafor, this is Amaka's Oven following up on your reply about the office opening." },
  { speaker: "S2 · Chidi", lang: "en+yo", text: "Ah yes. We need small chops for like 120 people, ṣùgbọ́n budget wa kò pọ̀ o." },
  { speaker: "S1 · SalesCrew", lang: "en", text: "Understood. For 120 guests we can do a mixed platter at a reduced per-head rate." },
  { speaker: "S2 · Chidi", lang: "yo+en", text: "Ẹ jọ̀ọ́, can you deliver to Trans-Amadi before 10am on Friday?" },
];
export async function POST(req: Request) {
  const { target = "Yoruba", provider } = await req.json().catch(() => ({}));
  const r = await complete([
    { role: "system", content: `You are the translation layer of a live sales call. For each line in the JSON transcript, give the meaning in ${target} for the listener and an English gloss. Then give: intent summary (1 line), and next action (book a slot / send quote). Return compact plain text.` },
    { role: "user", content: JSON.stringify(TRANSCRIPT) },
  ], { max: 700, prefer: prefer(provider), offline: "S2 intent: wants 120-head small chops, budget-sensitive, Friday 10am Trans-Amadi delivery. Next action: send quote + book Fri 10:00." });
  return Response.json({ transcript: TRANSCRIPT, pipeline: { asr: "muse-voice-transcribe-1.0 (diarization + code-switching)", s2st: "SeamlessM4T v2 (speech-to-speech)", reasoning: r.model }, analysis: r.text, provider: r.provider, fallback: r.fallback });
}
