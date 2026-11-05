// Live inbound: WhatsApp Cloud API, Messenger, Instagram Messaging → route to vendor → lead + conversation → AI auto-reply.
import { verifySignature, parseInbound, parseEngagements, sendMessage, fetchWaMedia, fetchProfile, vendorCreds } from "@/lib/meta";
import { agentReply, autoSendOn } from "@/lib/agent";
import { loadGlobal, loadWorkspace, mutate, saveGlobal, putMedia } from "@/lib/store";
import { matchInboundVendor, routeVendor, memoryFor, remember, capi, scoreLead } from "@/lib/pipeline";
import { RISE_WA_API, waNumbers } from "@/lib/brand";
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
  const g = await loadGlobal(); const results = []; let routesDirty = false;
  for (const m of parseInbound(body)) {
    const hinted = m.to && g.routes[m.to];
    const route = hinted || { workspaceId: process.env.DEFAULT_WORKSPACE_ID ?? "demo", vendorId: "" };
    const ws = route.workspaceId; const now = new Date().toISOString();
    const media = [] as { url: string; type: "image" | "video" }[];
    for (const x of m.media ?? []) { if (x.url) media.push({ url: x.url, type: x.type }); else if (x.id) { const f = await fetchWaMedia(x.id); if (f) media.push({ url: await putMedia(`${x.id}.${f.type.split("/")[1]}`, f.buf, f.type), type: x.type }); } }
    const pre = (await loadWorkspace(ws)).vendors.find((v) => v.id === route.vendorId); const known = (await loadWorkspace(ws)).conversations.find((x) => x.channel === m.channel && x.contactId === m.from);
    const prof = !known?.profile?.name || !known?.profile?.photo ? await fetchProfile(m.channel, m.from, vendorCreds(pre, m.channel).token) : null;
    let convId = "";
    await mutate(ws, async (w) => {
      const explicit = matchInboundVendor(w, m);
      const vendorId = route.vendorId || explicit || routeVendor(w, { channel: m.channel, text: m.text, to: m.to });
      if (explicit && m.to && !g.routes[m.to]) { g.routes[m.to] = { workspaceId: ws, vendorId }; routesDirty = true; }
      const rv = w.vendors.find((v) => v.id === vendorId);
      if (rv && m.channel === "whatsapp" && m.to && m.to === process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const nums = waNumbers(rv); const hit = nums.find((n) => n.display.replace(/\D/g, "").endsWith(RISE_WA_API.replace(/\D/g, "").slice(-10))) ?? nums[0];
        if (hit && hit.phoneNumberId !== m.to) { rv.channels.whatsapp = { ...rv.channels.whatsapp, status: rv.channels.whatsapp?.status ?? "connected", display: rv.channels.whatsapp?.display, phoneNumberId: rv.channels.whatsapp?.phoneNumberId || m.to, numbers: nums.map((n) => n === hit ? { ...n, phoneNumberId: m.to } : n) }; }
      }
      if (rv && m.channel === "instagram" && m.to && !rv.channels.instagram?.igUserId) { rv.channels.instagram = { ...rv.channels.instagram, igUserId: m.to, handle: rv.channels.instagram?.handle, status: "connected" }; }
      let c = w.conversations.find((x) => x.channel === m.channel && x.contactId === m.from);
      if (!c) { const leadId = uid("l"); const lead = { id: leadId, vendorId, name: m.name ?? prof?.name ?? (prof?.handle ? `@${prof.handle}` : `${m.channel} ${m.from.slice(-4)}`), company: "", email: "", phone: m.channel === "whatsapp" ? `+${m.from}` : "", source: `${m.channel} inbound`, channel: m.channel, segment: "Inbound", customerType: "B2C" as const, interests: [], productIds: [], score: 0, stage: "new" as const, value: 0, note: m.text, lang: "en", createdAt: now, tags: ["inbound"] };
        lead.score = scoreLead(lead); w.leads.unshift(lead);
        c = { id: uid("cv"), vendorId, leadId, channel: m.channel, contact: lead.name, contactId: m.from, messages: [], unread: 0, aiOn: w.vendors.find((v) => v.id === vendorId)?.autoReply ?? true, updatedAt: now, window24h: now, profile: { name: m.name ?? prof?.name, phone: m.channel === "whatsapp" ? `+${m.from}` : undefined, handle: prof?.handle, username: prof?.username, photo: prof?.photo }, avatar: prof?.photo }; w.conversations.unshift(c); await capi(w, vendorId, "lead", leadId, 0, undefined, "chat"); }
      if (prof) { c.profile = { ...c.profile, ...Object.fromEntries(Object.entries(prof).filter(([, v]) => v)) }; if (prof.photo) c.avatar = prof.photo; }
      w.engagements = [{ id: uid("e"), vendorId: c.vendorId, leadId: c.leadId, channel: m.channel, kind: "message" as const, who: c.contact, whoId: m.from, text: m.text, at: now, status: "replied" as const }, ...(w.engagements ?? [])].slice(0, 500);
      if (m.to) c.viaId = m.to;
      c.messages.push({ id: m.id ?? uid("m"), from: "customer", text: m.text, at: now, media: media.length ? media : undefined }); c.unread++; c.updatedAt = now; c.window24h = now; convId = c.id;
    });
    const w = await loadWorkspace(ws); const c = w.conversations.find((x) => x.id === convId)!;
    const v = w.vendors.find((x) => x.id === c.vendorId) as (typeof w.vendors)[number] & { tokens?: Record<string, string> };
    const auto = autoSendOn(w, c);
    const r = await agentReply(w, c.vendorId, c.channel, c.messages, w.settings.ai.primary, memoryFor(w, c.leadId));
    const creds = vendorCreds(v, m.channel) as { token?: string; phoneNumberId?: string; igUserId?: string }; if (m.channel === "whatsapp" && c.viaId) creds.phoneNumberId = c.viaId;
    const send = auto ? await sendMessage(m.channel, m.from, r.text, creds) : { ok: false, dryRun: true as boolean | undefined };
    await mutate(ws, async (w) => { const cc = w.conversations.find((x) => x.id === convId)!; cc.messages.push({ id: uid("m"), from: "ai", text: r.text, at: new Date().toISOString(), status: !auto ? "draft" : send.ok ? "sent" : send.dryRun ? "dry-run" : "failed" });
      if (r.handoff) cc.aiOn = r.model !== "handoff-policy";
      if (r.booked) { w.bookings.push({ id: uid("b"), vendorId: cc.vendorId, leadId: cc.leadId, title: `${cc.contact} — via ${cc.channel}`, start: r.booked, durationMin: w.settings.calls.slotMin, channel: cc.channel, status: "confirmed", source: "inbox" }); remember(w, cc.vendorId, cc.leadId, "promise", `Booked ${r.booked}`); await capi(w, cc.vendorId, "booked", cc.leadId); } });
    results.push({ conv: convId, send: { ok: send.ok, dryRun: send.dryRun } });
  }
  // Post engagement (comments, likes, shares, mentions) → Engagement feed; auto-engage task replies + private-DMs to sell.
  for (const e of parseEngagements(body)) { const route = g.routes[e.to] || { workspaceId: process.env.DEFAULT_WORKSPACE_ID ?? "demo", vendorId: "" };
    await mutate(route.workspaceId, (w) => { const vendorId = route.vendorId || w.vendors[0].id; const lead = w.leads.find((l) => e.who && l.name.toLowerCase() === e.who.replace(/^@/, "").toLowerCase());
      w.engagements = [{ id: uid("e"), vendorId, leadId: lead?.id, channel: e.channel, kind: e.kind, postId: e.postId, commentId: e.commentId, who: e.who, whoId: e.whoId, text: e.text, at: new Date().toISOString(), status: "new" as const }, ...(w.engagements ?? [])].slice(0, 500); });
    results.push({ engagement: e.kind }); }
  if (routesDirty) await saveGlobal(g);
  console.log("[meta-webhook]", JSON.stringify(results));
  return Response.json({ ok: true, handled: results.length });
}
