import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { capi } from "@/lib/pipeline";
export async function POST(req: Request) {
  const b = await req.json(); let out: unknown;
  const w = await mutate(await workspaceId(), async (w) => { out = await capi(w, b.vendorId ?? w.vendors[0].id, b.event, b.leadId, b.value ? Number(b.value) : undefined, b.currency, b.actionSource ?? "system_generated"); });
  return Response.json({ result: out, events: w.capi.slice(0, 50) });
}
