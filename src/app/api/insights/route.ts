import { workspaceId, getSession } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { insights, activityHours, productStats, proposeCampaign } from "@/lib/insights";
export const dynamic = "force-dynamic";
export async function GET(req: Request) { const w = await loadWorkspace(await workspaceId()); const v = new URL(req.url).searchParams.get("vendor") ?? undefined; const vid = v === "all" ? undefined : v;
  return Response.json({ insights: insights(w, vid), hours: activityHours(w, vid), products: productStats(w, vid).map((x) => ({ id: x.p.id, name: x.p.name, interested: x.interested, buyers: x.buyers, conv: x.conv, revenue: x.revenue, currency: x.p.currency })) }); }
export async function POST(req: Request) { const b = await req.json(); const s = await getSession(); let ap = null;
  const w = await mutate(await workspaceId(), (w) => { ap = proposeCampaign(w, b.vendorId ?? w.vendors[0].id, s?.email ?? "admin"); });
  return Response.json({ approval: ap, approvals: w.approvals, posts: w.posts }); }
