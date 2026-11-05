import { workspaceId } from "@/lib/auth";
import { loadWorkspace } from "@/lib/store";
export const dynamic = "force-dynamic";
// Tiny aggregate (≈300 bytes): stage counts + values + a version stamp. Clients poll this only while the tab is visible and
// pull the full workspace only when `v` changes — near-real-time pipeline numbers with minimal data use.
export async function GET(req: Request) {
  const w = await loadWorkspace(await workspaceId()); const vendor = new URL(req.url).searchParams.get("vendor") ?? "all";
  const leads = w.leads.filter((l) => vendor === "all" || l.vendorId === vendor); const stages: Record<string, { n: number; v: number }> = {};
  for (const l of leads) { const s = (stages[l.stage] ??= { n: 0, v: 0 }); s.n++; s.v += l.value; }
  const unread = w.conversations.filter((c) => vendor === "all" || c.vendorId === vendor).reduce((a, c) => a + (c.unread || 0), 0);
  return Response.json({ v: w.updatedAt, stages, leads: leads.length, unread }, { headers: { "Cache-Control": "no-store" } });
}
