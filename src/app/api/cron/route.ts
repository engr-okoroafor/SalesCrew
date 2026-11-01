// Daily cron (vercel.json): publish due posts, expire short-term memory, flag stale leads for NBA. Hobby plan = daily.
import { loadGlobal, mutate } from "@/lib/store";
import { runPost } from "@/lib/publisher";
import { remember } from "@/lib/pipeline";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const g = await loadGlobal(); const report: Record<string, number> = {};
  for (const { id } of g.workspaces) { let n = 0;
    await mutate(id, async (w) => { for (const p of w.posts.filter((p) => p.status === "scheduled" && +new Date(p.scheduledAt) <= Date.now())) { const r = await runPost(id, p); p.status = Object.values(r).some((x) => (x as { ok?: boolean }).ok) ? "posted" : "failed"; p.result = JSON.stringify(r).slice(0, 1500); n++; }
      w.memory = w.memory.filter((m) => m.scope === "long" || !m.ttlHours || Date.now() - +new Date(m.at) < m.ttlHours * 3600e3);
      for (const l of w.leads.filter((l) => !["won", "paid", "lost", "nurture"].includes(l.stage) && Date.now() - +new Date(l.lastTouch ?? l.createdAt) > 3 * 864e5)) remember(w, l.vendorId, l.id, "insight", `No touch in 3+ days at stage ${l.stage} — follow up`); });
    report[id] = n; }
  return Response.json({ ok: true, published: report });
}
