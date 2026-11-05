// Public view/inquiry beacon for product analytics (used by generated sites & share links): POST {ws?, productId, kind:"view"|"inquiry"}. CORS-open, no PII.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
const H = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };
export const OPTIONS = () => new Response(null, { headers: H });
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({})); if (!b.productId) return Response.json({ ok: false }, { status: 400, headers: H });
  const ws = typeof b.ws === "string" && /^[\w-]{1,40}$/.test(b.ws) ? b.ws : await workspaceId();
  await mutate(ws, async (w) => { const p = w.products.find((x) => x.id === b.productId); if (!p) return; if (b.kind === "inquiry") p.inquiries = (p.inquiries ?? 0) + 1; else p.views = (p.views ?? 0) + 1; });
  return Response.json({ ok: true }, { headers: H });
}
