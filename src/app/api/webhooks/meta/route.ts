// Live inbound: WhatsApp Cloud API, Messenger, Instagram Messaging → route to vendor → lead + conversation → AI auto-reply.
import { verifySignature, parseInbound, sendMessage, fetchWaMedia } from "@/lib/meta";
import { agentReply } from "@/lib/agent";
import { loadGlobal, loadWorkspace, mutate, putMedia } from "@/lib/store";
import { routeVendor, memoryFor, remember, capi, scoreLead } from "@/lib/pipeline";
import { uid } from "@/lib/schema";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && process.env.META_VERIFY_TOKEN && p.get("hub.verify_token") === process.env.META_VERIFY_TOKEN) return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });
  let body: unknown; try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const g = await loadGlobal(); const results = [];
  for (const m of parseInbound(body)) {
    const route = (m.to && g.routes[m.to]) || { workspaceId: process.env.DEFAULT_WORKSPACE_ID ?? "demo", vendorId: "" };
    const ws = route.workspaceId; const now = new Date().toISOString();
    const media = [] as { url: string; type: "image" | "video" }[];
    for (const x of m.media ?? []) { if (x.url) media.push({ url: x.url, type: x.type }); else if (x.id) { const f = await fetchWaMedia(x.id); if (f) media.push({ url: await putMedia(`${x.id}.${f.type.split("/")[1]}`, f.buf, f.type), type: x.type }); } }
    let convId = "";
    await mutate(ws, async (w) => {
      const vendorId = route.vendorId || routeVendor(w, { channel: m.channel, text: m.text, to: m.to });
      let c = w.conversations.find((x) => x.channel === m.channel && x.contactId === m.from);
      if (!c) { const leadId = uid("l"); const lead = { id: leadId, vendorId, name: m.name ?? `${m.channel} ${m.from.slice(-4)}`, company: "", email: "", phone: m.channel === "whatsapp" ? `+${m.from}` : "", source: `${m.channel} inbound`, channel: m.channel, segment: "Inbound", customerType: "B2C" as const, interests: [], productIds: [], score: 0, stage: "new" as const, value: 0, note: m.text, lang: "en", createdAt: now, tags: ["inbound"] };
        lead.score = scoreLead(lead); w.leads.unshift(lead);
        c = { id: uid("cv"), vendorId, leadId, channel: m.channel, contact: lead.name, contactId: m.from, messages: [], unread: 0, aiOn: w.vendors.find((v) => v.id === vendorId)?.autoReply ?? true, updatedAt: now, window24h: now }; w.conversations.unshift(c); await capi(w, vendorId, "lead", leadId, 0, undefined, "chat"); }
      c.messages.push({ id: m.id ?? uid("m"), from: "customer", text: m.text, at: now, media: media.length ? media : undefined }); c.unread++; c.updatedAt = now; c.window24h = now; convId = c.id;
    });
    const w = await loadWorkspace(ws); const c = w.conversations.find((x) => x.id === convId)!;
    if (!c.aiOn || !w.settings.ai.autoReply) { results.push({ conv: convId, skipped: "ai-off" }); continue; }
    const v = w.vendors.find((x) => x.id === c.vendorId) as (typeof w.vendors)[number] & { tokens?: Record<string, string> };
    const r = await agentReply(w, c.vendorId, c.channel, c.messages, w.settings.ai.primary, memoryFor(w, c.leadId));
    const send = await sendMessage(m.channel, m.from, r.text, { token: v?.tokens?.[m.channel], phoneNumberId: v?.channels.whatsapp?.phoneNumberId, igUserId: v?.channels.instagram?.igUserId });
    await mutate(ws, async (w) => { const cc = w.conversations.find((x) => x.id === convId)!; cc.messages.push({ id: uid("m"), from: "ai", text: r.text, at: new Date().toISOString(), status: send.ok ? "sent" : send.dryRun ? "dry-run" : "failed" });
      if (r.handoff) cc.aiOn = r.model !== "handoff-policy";
      if (r.booked) { w.bookings.push({ id: uid("b"), vendorId: cc.vendorId, leadId: cc.leadId, title: `${cc.contact} — via ${cc.channel}`, start: r.booked, durationMin: w.settings.calls.slotMin, channel: cc.channel, status: "confirmed", source: "inbox" }); remember(w, cc.vendorId, cc.leadId, "promise", `Booked ${r.booked}`); await capi(w, cc.vendorId, "booked", cc.leadId); } });
    results.push({ conv: convId, send: { ok: send.ok, dryRun: send.dryRun } });
  }
  console.log("[meta-webhook]", JSON.stringify(results));
  return Response.json({ ok: true, handled: results.length });
}
