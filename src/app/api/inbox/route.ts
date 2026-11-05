// Inbox actions: agent send (human), AI reply/draft, simulate inbound (demo). All persist + flow into pipeline.
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { agentReply, autoSendOn } from "@/lib/agent";
import { sendMessage, vendorCreds, type Channel } from "@/lib/meta";
import { memoryFor, remember, setStage, capi, audit } from "@/lib/pipeline";
import { uid, type Message } from "@/lib/schema";
import { prefer } from "@/lib/ai";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w0 = await loadWorkspace(ws);
  const c0 = w0.conversations.find((c) => c.id === b.conversationId); if (!c0) return Response.json({ error: "no conversation" }, { status: 404 });
  const now = () => new Date().toISOString();
  // Deliver on the conversation's own channel (WhatsApp / Messenger / Instagram) via Meta Graph with the vendor's credentials. Seeded demo contacts dry-run.
  const deliver = (text: string) => { const v = w0.vendors.find((x) => x.id === c0.vendorId); const creds = vendorCreds(v, c0.channel as Channel) as { token?: string; phoneNumberId?: string; igUserId?: string }; if (c0.channel === "whatsapp" && c0.viaId) creds.phoneNumberId = c0.viaId; return c0.contactId && !/^l\d|^demo/.test(c0.contactId) ? sendMessage(c0.channel as Channel, c0.contactId, text, creds) : Promise.resolve({ dryRun: true, ok: false, channel: c0.channel } as { ok: boolean; dryRun?: boolean; error?: string }); };
  if (b.action === "markRead") { const w = await mutate(ws, (w) => { const c = w.conversations.find((x) => x.id === c0.id)!; c.unread = b.unread ? Math.max(1, c.unread) : 0; }); return Response.json({ ok: true, workspace: w }); }
  if (b.action === "send") { // human agent message with optional media
    const s = await deliver(b.text);
    const w = await mutate(ws, (w) => { const c = w.conversations.find((x) => x.id === c0.id)!; c.messages.push({ id: uid("m"), from: "agent", text: b.text, at: now(), media: b.media, status: s.ok ? "sent" : s.dryRun ? "dry-run" : "failed" }); c.updatedAt = now(); c.unread = 0; setStage(w, c.leadId, "contacted"); });
    return Response.json({ ok: true, workspace: w, delivery: s });
  }
  if (b.action === "sendDraft") {
    const draft = c0.messages.find((m) => m.id === b.messageId && m.status === "draft"); if (!draft) return Response.json({ error: "no draft" }, { status: 404 });
    const s = await deliver(draft.text);
    const w = await mutate(ws, (w) => { const c = w.conversations.find((x) => x.id === c0.id)!; const m = c.messages.find((x) => x.id === draft.id); if (m) m.status = s.ok ? "sent" : s.dryRun ? "dry-run" : "failed"; c.updatedAt = now(); });
    return Response.json({ ok: true, workspace: w, delivery: s });
  }
  if (b.action === "inbound") { // simulate a customer message (demo / testing) — always lands in the inbox, then AI drafts
    await mutate(ws, (w) => { const c = w.conversations.find((x) => x.id === c0.id)!; c.messages.push({ id: uid("m"), from: "customer", text: b.text, at: now(), media: b.media }); c.unread++; c.updatedAt = now(); c.window24h = now(); });
  }
  if (b.action === "toggleAI") { const w = await mutate(ws, (w) => { const c = w.conversations.find((x) => x.id === c0.id)!; c.aiOn = !c.aiOn; }); return Response.json({ ok: true, workspace: w }); }
  // AI reply (action "ai" or after inbound)
  const w1 = await loadWorkspace(ws); const c1 = w1.conversations.find((c) => c.id === c0.id)!;
  const r = await agentReply(w1, c1.vendorId, c1.channel, c1.messages, prefer(b.provider ?? w1.settings.ai.primary), memoryFor(w1, c1.leadId));
  if (b.draftOnly) return Response.json({ draft: r.text, provider: r.provider, model: r.model, fallback: r.fallback });
  const auto = b.action !== "inbound" || autoSendOn(w1, c1);
  const s = auto ? await deliver(r.text) : { ok: false, dryRun: true as boolean | undefined, error: undefined as string | undefined };
  const w = await mutate(ws, async (w) => {
    const c = w.conversations.find((x) => x.id === c0.id)!; const msg: Message = { id: uid("m"), from: "ai", text: r.text, at: now(), status: auto ? (s.ok ? "sent" : s.dryRun ? "dry-run" : "failed") : "draft" }; c.messages.push(msg); c.updatedAt = now(); c.unread = 0;
    if (r.handoff && r.model === "handoff-policy") { c.aiOn = false; audit(w, "ai", "handoff", c.contact); }
    setStage(w, c.leadId, "contacted");
    if (r.booked) { const id = uid("b"); w.bookings.push({ id, vendorId: c.vendorId, leadId: c.leadId, title: `${c.contact} — booked via ${c.channel}`, start: r.booked, durationMin: w.settings.calls.slotMin, channel: c.channel, status: "confirmed", source: "inbox" });
      setStage(w, c.leadId, "qualified"); remember(w, c.vendorId, c.leadId, "promise", `Booked ${new Date(r.booked).toUTCString()} via ${c.channel}`); await capi(w, c.vendorId, "booked", c.leadId); }
    if ("pay" in r && r.pay) { remember(w, c.vendorId, c.leadId, "promise", "Customer ready to pay — send payment link"); setStage(w, c.leadId, "proposal"); }
  });
  return Response.json({ ok: true, workspace: w, ai: { provider: r.provider, model: r.model, fallback: r.fallback }, delivery: s });
}
