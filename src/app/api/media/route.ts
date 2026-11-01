import { getMedia } from "@/lib/store";
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams.get("p") ?? ""; const m = await getMedia(p);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(m.body as BodyInit, { headers: { "Content-Type": m.type, "Cache-Control": "public, max-age=31536000, immutable" } });
}
