import { complete, providerStatus } from "@/lib/ai";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const ping = new URL(req.url).searchParams.get("ping");
  if (!ping) return Response.json({ ok: true, providers: providerStatus() });
  const r = await complete([{ role: "user", content: "Reply with exactly: SalesCrew online" }], { max: 40, prefer: ping === "nvidia" ? "nvidia" : "meta" });
  return Response.json({ ok: r.provider !== "offline", provider: r.provider, model: r.model, fallback: r.fallback, ms: r.ms, text: r.text.slice(0, 80) });
}
