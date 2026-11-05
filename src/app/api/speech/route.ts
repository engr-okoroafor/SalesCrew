import { transcribe, speechToSpeech, voiceStatus } from "@/lib/voice";
export const maxDuration = 60;
export async function GET() { return Response.json(voiceStatus()); }
export async function POST(req: Request) {
  const f = await req.formData(); const audio = f.get("audio") as Blob | null; if (!audio) return Response.json({ error: "audio required" }, { status: 400 });
  if (f.get("task") === "s2st") return Response.json(await speechToSpeech(audio, String(f.get("tgt") ?? "en")));
  return Response.json(await transcribe(audio, String(f.get("lang") ?? "en")));
}
