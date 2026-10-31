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

export type Inbound = { channel: Channel; from: string; text: string; id?: string };
// Normalise webhook payloads. Only user-sent text messages; echoes/statuses ignored (inbound-only).
export function parseInbound(body: any): Inbound[] {
  const out: Inbound[] = [];
  if (body?.object === "whatsapp_business_account") {
    for (const e of body.entry ?? []) for (const c of e.changes ?? []) for (const m of c.value?.messages ?? [])
      if (m.type === "text") out.push({ channel: "whatsapp", from: m.from, text: m.text?.body ?? "", id: m.id });
  } else if (body?.object === "page" || body?.object === "instagram") {
    const channel: Channel = body.object === "page" ? "messenger" : "instagram";
    for (const e of body.entry ?? []) for (const ev of e.messaging ?? [])
      if (ev.message?.text && !ev.message.is_echo) out.push({ channel, from: ev.sender?.id, text: ev.message.text, id: ev.message.mid });
  }
  return out.filter((m) => m.from && m.text);
}

// Reply to a user who messaged first (RESPONSE inside the 24h window). Returns dry-run when creds absent.
export async function sendMessage(channel: Channel, to: string, text: string) {
  let url: string, token: string | undefined, payload: unknown;
  if (channel === "whatsapp") {
    token = process.env.WHATSAPP_ACCESS_TOKEN; url = `${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    payload = { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: text } };
  } else {
    token = process.env.META_PAGE_ACCESS_TOKEN;
    url = channel === "instagram" ? `${GRAPH}/${process.env.IG_USER_ID}/messages` : `${GRAPH}/me/messages`;
    payload = { recipient: { id: to }, messaging_type: "RESPONSE", message: { text } };
  }
  if (!token || url.includes("/undefined/")) return { ok: false, dryRun: true, channel };
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, dryRun: false, channel, status: r.status, id: j?.messages?.[0]?.id ?? j?.message_id, error: r.ok ? undefined : j?.error?.message };
}
