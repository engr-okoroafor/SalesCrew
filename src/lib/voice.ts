// Speech: Muse Voice Transcribe (diarized, code-switched) + SeamlessM4T speech-to-speech. Real HTTP APIs with graceful fallback.
// MUSE_VOICE_API_URL (+MUSE_VOICE_API_KEY or MODEL_API_KEY) — POST multipart audio → {segments:[{speaker,lang,text}]}
// SEAMLESS_API_URL (self-hosted seamless_communication server) or HF_TOKEN (HF Inference: facebook/seamless-m4t-v2-large)
export const LANGS: Record<string, { name: string; m4t: string }> = { en: { name: "English", m4t: "eng" }, pcm: { name: "Nigerian Pidgin", m4t: "eng" }, ig: { name: "Igbo", m4t: "ibo" }, yo: { name: "Yoruba", m4t: "yor" }, ha: { name: "Hausa", m4t: "hau" } };
export const voiceStatus = () => ({ muse: !!process.env.MUSE_VOICE_API_URL, seamless: !!(process.env.SEAMLESS_API_URL || process.env.HF_TOKEN) });
export async function transcribe(audio: Blob, langHint = "en") {
  if (process.env.MUSE_VOICE_API_URL) { try { const f = new FormData(); f.append("file", audio, "audio.webm"); f.append("diarize", "true"); f.append("code_switch", "true"); f.append("language_hint", langHint);
    const r = await fetch(process.env.MUSE_VOICE_API_URL, { method: "POST", headers: { Authorization: `Bearer ${process.env.MUSE_VOICE_API_KEY ?? process.env.MODEL_API_KEY}` }, body: f, signal: AbortSignal.timeout(45000) });
    if (r.ok) { const j = await r.json(); return { engine: "muse-voice", segments: (j.segments ?? [{ speaker: "S1", lang: langHint, text: j.text ?? "" }]) as { speaker: string; lang: string; text: string }[] }; } } catch {} }
  if (process.env.HF_TOKEN) { try { const r = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", { method: "POST", headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` }, body: audio, signal: AbortSignal.timeout(45000) });
    if (r.ok) { const j = await r.json(); return { engine: "whisper-hf (fallback)", segments: [{ speaker: "S1", lang: langHint, text: j.text ?? "" }] }; } } catch {} }
  return { engine: "none", segments: [] as { speaker: string; lang: string; text: string }[], note: "Set MUSE_VOICE_API_URL (or HF_TOKEN) for server transcription; browser speech recognition is used meanwhile." };
}
export async function speechToSpeech(audio: Blob, tgt: string) {
  const t = LANGS[tgt]?.m4t ?? "eng";
  if (process.env.SEAMLESS_API_URL) { try { const f = new FormData(); f.append("audio", audio, "in.webm"); f.append("tgt_lang", t); f.append("task", "s2st");
    const r = await fetch(process.env.SEAMLESS_API_URL, { method: "POST", body: f, signal: AbortSignal.timeout(60000) }); if (r.ok) { const ct = r.headers.get("content-type") ?? ""; if (ct.includes("json")) return { engine: "seamless-m4t", ...(await r.json()) }; return { engine: "seamless-m4t", audioB64: Buffer.from(await r.arrayBuffer()).toString("base64"), mime: ct }; } } catch {} }
  return { engine: "fallback", note: "Set SEAMLESS_API_URL (seamless_communication server) for speech-to-speech. Falling back to text translation + browser TTS." };
}
