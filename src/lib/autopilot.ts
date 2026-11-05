// Autopilot: scheduled tasks (hourly/daily/weekly) with human-in-the-loop. Tasks with approval=true queue Approvals; others execute immediately.
// Run by /api/cron (Vercel cron) and by "Run now" in Admin → Autopilot. Every action is audited.
import { sendMessage, vendorCreds, type Channel as MetaCh } from "@/lib/meta";
import { runPost } from "@/lib/publisher";
import { act } from "@/lib/engage";
import { audit, setStage, remember } from "@/lib/pipeline";
import { complete, prefer } from "@/lib/ai";
import { uid, defaultTasks, type Approval, type Stage, type Task, type Workspace } from "@/lib/schema";
export type Action = { type: "message" | "engage" | "publish" | "schedule" | "stage" | "digest" | "note"; payload: Record<string, unknown> };
type Plan = { title: string; detail: string; action: Action };
const H = 3600e3; const STEP = { hourly: H, daily: 24 * H, weekly: 168 * H };
const due = (t: Task, now: number) => !t.nextRun || +new Date(t.nextRun) <= now;
const first = (n: string) => n.split(" ")[0];
export async function sendToLead(w: Workspace, leadId: string, text: string) {
  const l = w.leads.find((x) => x.id === leadId); if (!l) return { status: "skipped" };
  const conv = w.conversations.filter((c) => c.leadId === l.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]; const ch = (conv?.channel ?? l.channel) as string;
  const mc = (["whatsapp", "messenger", "instagram"].includes(ch) ? ch : "whatsapp") as MetaCh; const to = conv?.contactId && !/^l\d|^demo/.test(conv.contactId) ? conv.contactId : mc === "whatsapp" ? l.phone.replace(/\D/g, "") : "";
  let status: "sent" | "dry-run" = "dry-run"; if (to) { const r = await sendMessage(mc, to, text, vendorCreds(w.vendors.find((v) => v.id === l.vendorId), mc)); if (r.ok) status = "sent"; }
  if (conv) { conv.messages.push({ id: uid("m"), from: "ai", text, at: new Date().toISOString(), status }); conv.updatedAt = new Date().toISOString(); }
  w.outreach.unshift({ id: uid("o"), vendorId: l.vendorId, leadId: l.id, channel: mc, body: text, status, at: new Date().toISOString() }); setStage(w, l.id, "contacted"); return { status, channel: mc };
}
export async function plan(w: Workspace, ws: string, t: Task): Promise<Plan[]> {
  const now = Date.now(); const out: Plan[] = [];
  if (t.kind === "follow-up-stale") for (const l of w.leads.filter((l) => !["won", "paid", "lost", "nurture"].includes(l.stage) && now - +new Date(l.lastTouch ?? l.createdAt) > 3 * 864e5).slice(0, 10)) {
    const v = w.vendors.find((x) => x.id === l.vendorId); const r = await complete([{ role: "system", content: `Write one short friendly WhatsApp follow-up (max 40 words) from ${v?.name}. Language ${l.lang}. No pressure, one clear question.` }, { role: "user", content: `${l.name} (${l.stage}) interested in ${l.interests.join(", ") || l.note || "our products"}` }], { max: 120, prefer: prefer(w.settings.ai.primary), offline: `Hi ${first(l.name)}, just checking in from ${v?.name} — still interested? I can hold a slot or send prices today.` });
    out.push({ title: `Follow up ${l.name}`, detail: r.text, action: { type: "message", payload: { leadId: l.id, text: r.text } } }); }
  if (t.kind === "payment-reminder") for (const p of w.payments.filter((p) => ["initiated", "pending-confirmation"].includes(p.status) && now - +new Date(p.at) > 24 * H && p.leadId).slice(0, 10)) { const l = w.leads.find((x) => x.id === p.leadId); if (!l) continue;
    const text = `Hi ${first(l.name)}, gentle reminder: your order (ref ${p.ref}, ${p.currency} ${p.amount.toLocaleString()}) is still open. Pay here: ${p.url ?? ""} — reply if you need bank details.`; out.push({ title: `Payment reminder · ${l.name}`, detail: text, action: { type: "message", payload: { leadId: l.id, text } } }); }
  if (t.kind === "reactivate-paid") for (const l of w.leads.filter((l) => ["paid", "nurture"].includes(l.stage) && now - +new Date(l.lastTouch ?? l.createdAt) > 30 * 864e5).slice(0, 10)) {
    const text = `Hi ${first(l.name)}! It's been a while — thank you again for your order. We have something new you might like; want me to send details?`; out.push({ title: `Re-engage ${l.name}`, detail: text, action: { type: "message", payload: { leadId: l.id, text } } }); }
  if (t.kind === "auto-engage") { const n = (w.engagements ?? []).filter((e) => e.status === "new" && ["comment", "mention", "like", "share"].includes(e.kind)); if (n.length) out.push({ title: `Reply to ${n.length} engager${n.length > 1 ? "s" : ""}`, detail: n.slice(0, 6).map((e) => `${e.who}: ${e.kind}${e.text ? ` “${e.text}”` : ""}`).join("\n"), action: { type: "engage", payload: { ids: n.map((e) => e.id) } } }); }
  if (t.kind === "publish-due") { const d = w.posts.filter((p) => p.status === "scheduled" && +new Date(p.scheduledAt) <= now); if (d.length) out.push({ title: `Publish ${d.length} due post(s)`, detail: d.map((p) => p.text.slice(0, 80)).join("\n"), action: { type: "publish", payload: { ids: d.map((p) => p.id), ws } } }); }
  if (t.kind === "digest") { const day = w.leads.filter((l) => now - +new Date(l.createdAt) < 24 * H).length; const paid = w.payments.filter((p) => p.status === "paid" && now - +new Date(p.at) < 24 * H);
    out.push({ title: "Daily digest", detail: `${day} new leads · ${paid.length} payments · ${w.conversations.reduce((a, c) => a + c.unread, 0)} unread · ${(w.approvals ?? []).filter((a) => a.status === "pending").length} approvals waiting`, action: { type: "digest", payload: {} } }); }
  if (t.kind === "custom" && t.prompt) { const r = await complete([{ role: "system", content: "You are the sales ops autopilot. Given the instruction and data, reply with 1-3 concrete suggested actions, one per line." }, { role: "user", content: `${t.prompt}\nLeads: ${w.leads.length}, open: ${w.leads.filter((l) => !["paid", "lost"].includes(l.stage)).length}` }], { max: 300, offline: "Review hot leads (score ≥ 75) and message them today." });
    out.push({ title: t.name, detail: r.text, action: { type: "note", payload: {} } }); }
  return out;
}
export async function execute(w: Workspace, a: Action, ws?: string) {
  const p = a.payload;
  if (a.type === "message") { const r = await sendToLead(w, String(p.leadId), String(p.text)); remember(w, w.leads.find((l) => l.id === p.leadId)?.vendorId ?? w.vendors[0].id, String(p.leadId), "promise", `Autopilot follow-up (${r.status})`); return r.status; }
  if (a.type === "engage") { let n = 0; for (const e of (w.engagements ?? []).filter((e) => (p.ids as string[]).includes(e.id) && e.status === "new")) { await act(w, e, e.kind === "comment" ? "both" : "dm"); n++; } return `${n} engaged`; }
  if (a.type === "publish") { let n = 0; for (const post of w.posts.filter((x) => (p.ids as string[]).includes(x.id) && x.status === "scheduled")) { const r = await runPost(ws ?? String(p.ws), post); post.status = Object.values(r).some((x) => (x as { ok?: boolean }).ok) ? "posted" : "failed"; post.result = JSON.stringify(r).slice(0, 1500); n++; } return `${n} published`; }
  if (a.type === "schedule") { let n = 0; for (const post of w.posts.filter((x) => (p.ids as string[]).includes(x.id))) { if (typeof p.text === "string" && p.text.trim()) post.text = p.text; post.status = "scheduled"; n++; } return `${n} scheduled (cron publishes at the audience peak)`; }
  if (a.type === "stage") { setStage(w, String(p.leadId), p.stage as Stage); return "stage set"; }
  return "noted";
}
export async function runTasks(w: Workspace, ws: string, opts: { taskId?: string; now?: number } = {}) {
  const now = opts.now ?? Date.now(); w.tasks ??= defaultTasks(); w.approvals ??= []; const log: string[] = [];
  for (const t of w.tasks.filter((t) => (opts.taskId ? t.id === opts.taskId : t.enabled && due(t, now)))) { const plans = await plan(w, ws, t); let q = 0, x = 0;
    for (const pl of plans) { if (t.approval && pl.action.type !== "digest") { if (!w.approvals.some((a) => a.status === "pending" && a.title === pl.title)) { w.approvals.unshift({ id: uid("ap"), taskId: t.id, title: pl.title, detail: pl.detail, action: pl.action, status: "pending", at: new Date().toISOString() } as Approval); q++; } }
      else { await execute(w, pl.action, ws); x++; } }
    t.lastRun = new Date(now).toISOString(); t.nextRun = new Date(now + STEP[t.schedule]).toISOString(); t.lastResult = plans.length ? `${x} done · ${q} awaiting approval` : "nothing to do"; log.push(`${t.name}: ${t.lastResult}`); }
  w.approvals = w.approvals.slice(0, 200); if (log.length) audit(w, "autopilot", "tasks.run", log.join(" | ")); return log;
}
