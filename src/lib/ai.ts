// Meta Model API (primary) -> NVIDIA NIM Nemotron (fallback) harness. Server-only; keys from env.
export type Msg = { role: "system" | "user" | "assistant"; content: string };
export type Provider = "meta" | "nvidia";
export const META_MODEL = process.env.META_MODEL ?? "muse-spark-1.3";
export const NV_MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-super-vl-120b-a12b";
const META_BASE = process.env.META_MODEL_API_BASE ?? "https://api.meta.ai/v1";
const NV_BASE = "https://integrate.api.nvidia.com/v1";

async function meta(messages: Msg[], max: number, to = 25000) {
  const key = process.env.MODEL_API_KEY; if (!key) throw new Error("meta: no key");
  const r = await fetch(`${META_BASE}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: META_MODEL, messages, max_tokens: Math.max(max, 1500), reasoning_effort: "low" }), signal: AbortSignal.timeout(to) });
  if (!r.ok) throw new Error(`meta ${r.status}`);
  const t = String((await r.json()).choices?.[0]?.message?.content ?? "").trim(); if (!t) throw new Error("meta: empty");
  return t;
}
async function nvidia(messages: Msg[], max: number, to = 30000) {
  const key = process.env.NVIDIA_API_KEY; if (!key) throw new Error("nvidia: no key");
  const r = await fetch(`${NV_BASE}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: NV_MODEL, messages, max_tokens: max, temperature: 0.4, chat_template_kwargs: { enable_thinking: false } }), signal: AbortSignal.timeout(to) });
  if (!r.ok) throw new Error(`nvidia ${r.status}`);
  const m = (await r.json()).choices?.[0]?.message ?? {}; const t = String(m.content ?? m.reasoning_content ?? "").trim(); if (!t) throw new Error("nvidia: empty");
  return t;
}
export type AIResult = { text: string; provider: Provider | "offline"; model: string; fallback: boolean; ms: number };
export async function complete(messages: Msg[], opts: { max?: number; prefer?: Provider; offline?: string; timeoutMs?: number } = {}): Promise<AIResult> {
  const max = opts.max ?? 600; const t0 = Date.now(); const order: Provider[] = opts.prefer === "nvidia" ? ["nvidia", "meta"] : ["meta", "nvidia"];
  for (const [i, p] of order.entries()) {
    try { const text = p === "meta" ? await meta(messages, max, opts.timeoutMs) : await nvidia(messages, max, opts.timeoutMs); return { text, provider: p, model: p === "meta" ? META_MODEL : NV_MODEL, fallback: i > 0, ms: Date.now() - t0 }; }
    catch (e) { console.warn(`[ai] ${p} failed: ${(e as Error).message}`); }
  }
  return { text: opts.offline ?? "AI providers unavailable — showing scripted demo output.", provider: "offline", model: "demo-script", fallback: true, ms: Date.now() - t0 };
}
export const providerStatus = () => ({ meta: !!process.env.MODEL_API_KEY, nvidia: !!process.env.NVIDIA_API_KEY, metaModel: META_MODEL, nvidiaModel: NV_MODEL });
export const prefer = (v: unknown): Provider => (v === "nvidia" ? "nvidia" : "meta");
// Guard against a repeated completion (same text emitted twice back-to-back).
function dedupe(t: string) { const h = t.length / 2; if (Number.isInteger(h) && t.slice(0, h) === t.slice(h)) return t.slice(0, h).trim();
  for (let i = Math.floor(t.length * 0.4); i < t.length * 0.6; i++) { const a = t.slice(0, i).trim(); if (a.length > 20 && t.slice(i).trim() === a) return a; } return t; }
// Vision: read text/details from an image (menus, price lists, flyers, UI screenshots). OpenAI-style image_url parts; Meta first, NVIDIA VL fallback.
export async function vision(prompt: string, dataUrl: string, max = 1200): Promise<AIResult> {
  const t0 = Date.now(); const msgs = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }];
  for (const [p, base, key, model] of [["meta", META_BASE, process.env.MODEL_API_KEY, META_MODEL], ["nvidia", NV_BASE, process.env.NVIDIA_API_KEY, NV_MODEL]] as const) { if (!key) continue;
    try { const r = await fetch(`${base}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: msgs, max_tokens: max }), signal: AbortSignal.timeout(40000) });
      if (!r.ok) throw new Error(`${p} ${r.status}`); const t = String((await r.json()).choices?.[0]?.message?.content ?? "").trim(); if (t) return { text: t, provider: p, model, fallback: p === "nvidia", ms: Date.now() - t0 }; } catch (e) { console.warn(`[vision] ${(e as Error).message}`); } }
  return { text: "", provider: "offline", model: "none", fallback: true, ms: Date.now() - t0 };
}
