// Vercel cron (vercel.json): runs every workspace's due autopilot tasks (publish, stale follow-ups, auto-engage, payment reminders, reactivation, digest),
// queuing Approvals where the owner asked for human-in-the-loop, then expires short-term memory. Hobby = daily schedule; "Run now" in Admin covers the rest.
import { loadGlobal, mutate } from "@/lib/store";
import { runTasks } from "@/lib/autopilot";
import { proposeCampaign } from "@/lib/insights";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const g = await loadGlobal(); const report: Record<string, string[]> = {}; const ids = [...new Set(["demo", ...g.workspaces.map((w) => w.id)])];
  for (const id of ids) await mutate(id, async (w) => { report[id] = await runTasks(w, id);
    // Autonomous campaigns: one timezone-aware proposal per active vendor per day (skipped if one is already pending) — owner approves/edits.
    if (w.settings && (w.settings as { autoCampaigns?: boolean }).autoCampaigns !== false) for (const v of w.vendors.filter((v) => v.active)) if (!(w.approvals ?? []).some((a) => a.status === "pending" && a.action.type === "schedule" && a.title.includes(v.name))) { const ap = proposeCampaign(w, v.id, "cron"); if (ap) report[id].push(ap.title); } w.memory = w.memory.filter((m) => m.scope === "long" || !m.ttlHours || Date.now() - +new Date(m.at) < m.ttlHours * 3600e3); });
  return Response.json({ ok: true, report });
}
