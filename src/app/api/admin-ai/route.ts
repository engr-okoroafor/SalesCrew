// Natural-language admin: "who should I follow up today?", "move Chidi to proposal", "remind everyone with unpaid orders", "every Monday DM people who commented".
// The AI analyses a compact workspace snapshot, answers, suggests, and proposes concrete actions. Actions are queued as Approvals (human-in-the-loop) unless execute=true.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { complete, prefer } from "@/lib/ai";
import { parseJSON } from "@/lib/json";
import { execute, type Action } from "@/lib/autopilot";
import { uid, type Task } from "@/lib/schema";
import { audit } from "@/lib/pipeline";
export const maxDuration = 60;
type Out = { answer: string; suggestions?: string[]; actions?: ({ type: "message"; leadId: string; text: string } | { type: "stage"; leadId: string; stage: string } | { type: "task"; name: string; prompt: string; schedule: "hourly" | "daily" | "weekly"; kind?: Task["kind"] })[] };
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const q = String(b.prompt ?? "").slice(0, 2000); let out: Out = { answer: "" }; const queued: string[] = [];
  const w = await mutate(ws, async (w) => { const now = Date.now();
    const snap = { vendors: w.vendors.map((v) => ({ id: v.id, name: v.name, industry: v.industry, channels: Object.keys(v.channels ?? {}), kb: (v.knowledge ?? "").length, bank: (v.bank ?? []).length })),
      leads: w.leads.slice(0, 80).map((l) => ({ id: l.id, n: l.name, v: l.vendorId, st: l.stage, sc: l.score, val: l.value, ch: l.channel, days: Math.round((now - +new Date(l.lastTouch ?? l.createdAt)) / 864e5), int: l.interests.slice(0, 3) })),
      payments: w.payments.slice(0, 40).map((p) => ({ ref: p.ref, lead: p.leadId, st: p.status, amt: p.amount, cur: p.currency })), unread: w.conversations.reduce((a, c) => a + c.unread, 0),
      engagersNew: (w.engagements ?? []).filter((e) => e.status === "new").length, products: w.products.slice(0, 40).map((p) => ({ id: p.id, n: p.name, price: p.price, views: p.views ?? 0, buyers: p.buyers ?? 0 })), tasks: (w.tasks ?? []).map((t) => `${t.name} (${t.schedule}${t.enabled ? "" : ", off"})`) };
    const r = await complete([{ role: "system", content: `You are SalesCrew's admin copilot for a Nigerian multi-vendor business. Analyse the data, answer the owner's request concisely, give up to 4 suggestions, and propose concrete actions.
Return ONLY JSON: {"answer":"markdown, short","suggestions":["..."],"actions":[{"type":"message","leadId":"id","text":"WhatsApp-ready text"}|{"type":"stage","leadId":"id","stage":"new|contacted|qualified|proposal|won|paid|nurture|lost"}|{"type":"task","name":"...","prompt":"what to do","schedule":"hourly|daily|weekly","kind":"custom|follow-up-stale|auto-engage|payment-reminder|reactivate-paid|digest"}]}. Use only ids that exist. Max 10 actions.` }, { role: "user", content: `DATA ${JSON.stringify(snap)}\n\nREQUEST: ${q}` }], { max: 1500, prefer: prefer(w.settings.ai.primary), offline: "" });
    out = parseJSON<Out>(r.text, { answer: "" });
    if (!out.answer) { const stale = w.leads.filter((l) => !["paid", "lost", "won", "nurture"].includes(l.stage) && now - +new Date(l.lastTouch ?? l.createdAt) > 3 * 864e5); const unpaid = w.payments.filter((p) => p.status !== "paid");
      out = { answer: `**Snapshot** — ${w.leads.length} leads, ${stale.length} need a follow-up, ${unpaid.length} unpaid payment links, ${snap.unread} unread chats, ${snap.engagersNew} new engagers. (AI offline: set MODEL_API_KEY or NVIDIA_API_KEY for full natural-language control.)`,
        suggestions: ["Approve the follow-ups below", "Turn on auto-engage for post comments", "Add bank details so transfer payments work", "Upload a price list to the knowledge base"],
        actions: stale.slice(0, 5).map((l) => ({ type: "message" as const, leadId: l.id, text: `Hi ${l.name.split(" ")[0]}, checking in — still interested? I can send prices or book you in today.` })) }; }
    for (const a of (out.actions ?? []).slice(0, 10)) {
      if (a.type === "task") { w.tasks ??= []; w.tasks.push({ id: uid("t"), name: a.name, kind: a.kind ?? "custom", schedule: a.schedule ?? "daily", enabled: true, approval: true, prompt: a.prompt }); queued.push(`task: ${a.name}`); continue; }
      const l = w.leads.find((x) => x.id === a.leadId); if (!l) continue; const action: Action = a.type === "message" ? { type: "message", payload: { leadId: l.id, text: a.text } } : { type: "stage", payload: { leadId: l.id, stage: a.stage } };
      if (b.execute) { await execute(w, action, ws); queued.push(`done: ${a.type} ${l.name}`); } else { (w.approvals ??= []).unshift({ id: uid("ap"), title: a.type === "message" ? `Message ${l.name}` : `Move ${l.name} → ${(a as { stage: string }).stage}`, detail: a.type === "message" ? a.text : `Stage change requested by admin AI`, action, status: "pending", at: new Date().toISOString() }); queued.push(`approval: ${a.type} ${l.name}`); } }
    audit(w, "admin-ai", "nl.command", q.slice(0, 140)); });
  return Response.json({ ...out, queued, approvals: w.approvals, tasks: w.tasks });
}
