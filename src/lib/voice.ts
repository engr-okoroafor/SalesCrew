// Speech: Meta Muse Voice via MODEL_API_KEY, or MUSE_VOICE_API_URL when that override is set.
// Browser speech recognition is the only fallback. HF_TOKEN is not required.
export const LANGS: Record<string, { name: string; m4t: string }> = { en: { name: "English", m4t: "eng" }, pcm: { name: "Nigerian Pidgin", m4t: "eng" }, ig: { name: "Igbo", m4t: "ibo" }, yo: { name: "Yoruba", m4t: "yor" }, ha: { name: "Hausa", m4t: "hau" } };
const museKey = () => process.env.MUSE_VOICE_API_KEY || process.env.MODEL_API_KEY;
export const voiceStatus = () => ({ muse: !!(process.env.MUSE_VOICE_API_URL || museKey()), via: process.env.MUSE_VOICE_API_URL ? "url" : museKey() ? "model" : "browser", seamless: !!process.env.SEAMLESS_API_URL });
export async function transcribe(audio: Blob, langHint = "en") {
  const key = museKey(); const custom = process.env.MUSE_VOICE_API_URL;
  if (custom || key) { try { const f = new FormData(); f.append("file", audio, "audio.webm");
    if (custom) { f.append("diarize", "true"); f.append("code_switch", "true"); f.append("language_hint", langHint); }
    else { f.append("model", process.env.MUSE_VOICE_MODEL ?? "muse-voice-transcribe-1.0"); f.append("language", langHint); }
    const url = custom || `${process.env.META_MODEL_API_BASE ?? "https://api.meta.ai/v1"}/audio/transcriptions`;
    const headers: Record<string, string> = {}; if (key) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(url, { method: "POST", headers, body: f, signal: AbortSignal.timeout(45000) });
    if (r.ok) { const j = await r.json(); return { engine: custom ? "muse-voice-url" : "muse-voice", segments: (j.segments ?? [{ speaker: "S1", lang: langHint, text: j.text ?? "" }]) as { speaker: string; lang: string; text: string }[] }; } } catch {} }
  return { engine: "none", segments: [] as { speaker: string; lang: string; text: string }[], note: "Browser speech recognition is the fallback." };
}
export async function speechToSpeech(audio: Blob, tgt: string) {
  const t = LANGS[tgt]?.m4t ?? "eng";
  if (process.env.SEAMLESS_API_URL) { try { const f = new FormData(); f.append("audio", audio, "in.webm"); f.append("tgt_lang", t); f.append("task", "s2st");
    const r = await fetch(process.env.SEAMLESS_API_URL, { method: "POST", body: f, signal: AbortSignal.timeout(60000) }); if (r.ok) { const ct = r.headers.get("content-type") ?? ""; if (ct.includes("json")) return { engine: "seamless-m4t", ...(await r.json()) }; return { engine: "seamless-m4t", audioB64: Buffer.from(await r.arrayBuffer()).toString("base64"), mime: ct }; } } catch {} }
  return { engine: "fallback", note: "Browser text-to-speech is the fallback." };
}
