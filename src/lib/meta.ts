// Meta messaging connect: WhatsApp Cloud API, Messenger, Instagram Messaging via Graph API. Server-only.
import crypto from "node:crypto";
export type Channel = "whatsapp" | "messenger" | "instagram";
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v21.0"}`;
const has = (k: string) => !!process.env[k];

export function channelStatus() {
  const app = has("META_APP_SECRET") && has("META_VERIFY_TOKEN");
  const st = (need: string[]) => { const missing = need.filter((k) => !has(k)); return { status: missing.length === 0 ? "connected" : missing.length === need.length ? "demo" : "missing", missing }; };
  return {
    webhook: { url: "/api/webhooks/meta", ready: app, missing: ["META_APP_ID", "META_APP_SECRET", "META_VERIFY_TOKEN"].filter((k) => !has(k)) },
    whatsapp: st(["META_APP_SECRET", "META_VERIFY_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"]),
    messenger: st(["META_APP_SECRET", "META_VERIFY_TOKEN", "META_PAGE_ACCESS_TOKEN"]),
    instagram: st(["META_APP_SECRET", "META_VERIFY_TOKEN", "META_PAGE_ACCESS_TOKEN", "IG_USER_ID"]),
  };
}

export function verifySignature(raw: string, header: string | null) {
  const secret = process.env.META_APP_SECRET; if (!secret || !header?.startsWith("sha256=")) return false;
  const exp = crypto.createHmac("sha256", secret).update(raw).digest("hex"); const got = header.slice(7);
  return exp.length === got.length && crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(got));
}

export type Inbound = { channel: Channel; from: string; text: string; id?: string; to?: string; name?: string; media?: { id?: string; url?: string; type: "image" | "video" }[] };
// Normalise webhook payloads. Only user-sent text messages; echoes/statuses ignored (inbound-only).
export function parseInbound(body: any): Inbound[] {
  const out: Inbound[] = [];
  if (body?.object === "whatsapp_business_account") {
    for (const e of body.entry ?? []) for (const c of e.changes ?? []) for (const m of c.value?.messages ?? [])
      if (["text", "image", "video"].includes(m.type)) out.push({ channel: "whatsapp", from: m.from, to: c.value?.metadata?.phone_number_id, name: c.value?.contacts?.[0]?.profile?.name,
        text: m.text?.body ?? m.image?.caption ?? m.video?.caption ?? `[${m.type}]`, id: m.id, media: m.image ? [{ id: m.image.id, type: "image" }] : m.video ? [{ id: m.video.id, type: "video" }] : undefined });
  } else if (body?.object === "page" || body?.object === "instagram") {
    const channel: Channel = body.object === "page" ? "messenger" : "instagram";
    for (const e of body.entry ?? []) for (const ev of e.messaging ?? [])
      if ((ev.message?.text || ev.message?.attachments) && !ev.message.is_echo) out.push({ channel, from: ev.sender?.id, to: e.id ?? ev.recipient?.id, text: ev.message.text ?? "[attachment]", id: ev.message.mid,
        media: (ev.message.attachments ?? []).filter((a: any) => ["image", "video"].includes(a.type)).map((a: any) => ({ url: a.payload?.url, type: a.type })) });
  }
  return out.filter((m) => m.from && m.text);
}

// Reply to a user who messaged first (RESPONSE inside the 24h window). Returns dry-run when creds absent.
export async function sendMessage(channel: Channel, to: string, text: string, creds: { token?: string; phoneNumberId?: string; igUserId?: string } = {}) {
  let url: string, token: string | undefined, payload: unknown;
  if (channel === "whatsapp") {
    token = creds.token ?? process.env.WHATSAPP_ACCESS_TOKEN; url = `${GRAPH}/${creds.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    payload = { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: text } };
  } else {
    token = creds.token ?? process.env.META_PAGE_ACCESS_TOKEN;
    url = channel === "instagram" ? `${GRAPH}/${creds.igUserId ?? process.env.IG_USER_ID}/messages` : `${GRAPH}/me/messages`;
    payload = { recipient: { id: to }, messaging_type: "RESPONSE", message: { text } };
  }
  if (!token || url.includes("/undefined/")) return { ok: false, dryRun: true, channel };
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, dryRun: false, channel, status: r.status, id: j?.messages?.[0]?.id ?? j?.message_id, error: r.ok ? undefined : j?.error?.message };
}

export { GRAPH };
async function g(path: string, method: string, token: string | undefined, body?: unknown) {
  if (!token) return { ok: false, dryRun: true, path };
  const r = await fetch(`${GRAPH}/${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({})); return { ok: r.ok, dryRun: false, status: r.status, id: j.id ?? j.post_id, error: r.ok ? undefined : j?.error?.message, data: j };
}
// Organic publishing. FB Page feed/photo, IG feed (container → publish), WA broadcast (template to opted-in contacts).
// FB Groups & WA Communities have no public publish API → returned as share-intent links for one-tap manual posting.
export async function publish(target: string, text: string, image: string | undefined, opts: { pageId?: string; pageToken?: string; igUserId?: string; waToken?: string; waPhoneId?: string; to?: string[] } = {}) {
  const pageId = opts.pageId ?? process.env.META_PAGE_ID ?? "me"; const ptok = opts.pageToken ?? process.env.META_PAGE_ACCESS_TOKEN;
  const abs = image && image.startsWith("http") ? image : undefined;
  switch (target) {
    case "fb_feed": return abs ? g(`${pageId}/photos`, "POST", ptok, { url: abs, caption: text }) : g(`${pageId}/feed`, "POST", ptok, { message: text });
    case "ig_feed": { const ig = opts.igUserId ?? process.env.IG_USER_ID; if (!ig || !abs) return { ok: false, dryRun: true, reason: !ig ? "IG_USER_ID not set" : "IG needs a public image URL" };
      const c = await g(`${ig}/media`, "POST", ptok, { image_url: abs, caption: text }); if (!c.ok || !c.id) return c; return g(`${ig}/media_publish`, "POST", ptok, { creation_id: c.id }); }
    case "wa_broadcast": case "wa_status": { const res = []; for (const to of (opts.to ?? []).slice(0, 50)) res.push(await sendMessage("whatsapp", to, text, { token: opts.waToken, phoneNumberId: opts.waPhoneId })); return { ok: res.every((r) => r.ok), dryRun: res.some((r) => r.dryRun) || !res.length, sent: res.length }; }
    case "fb_group": return { ok: false, manual: true, shareUrl: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}` };
    case "wa_community": return { ok: false, manual: true, shareUrl: `https://wa.me/?text=${encodeURIComponent(text)}` };
    default: return { ok: false, dryRun: true, reason: "use Outreach to DM contacts" };
  }
}
// WhatsApp Business Calling API (business-initiated call needs user permission). Graceful dry-run when not enabled.
export async function waCall(to: string, creds: { token?: string; phoneNumberId?: string } = {}) {
  const token = creds.token ?? process.env.WHATSAPP_ACCESS_TOKEN; const pid = creds.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !pid || process.env.WA_CALLING_ENABLED !== "1") return { ok: false, dryRun: true, reason: "Set WA_CALLING_ENABLED=1 after enabling Calling on the number" };
  return g(`${pid}/calls`, "POST", token, { messaging_product: "whatsapp", to, action: "connect" });
}
export async function fetchWaMedia(id: string) { const token = process.env.WHATSAPP_ACCESS_TOKEN; if (!token) return null;
  const m = await g(id, "GET", token); const url = (m as any).data?.url; if (!url) return null;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); return r.ok ? { buf: await r.arrayBuffer(), type: r.headers.get("content-type") ?? "image/jpeg" } : null; }
