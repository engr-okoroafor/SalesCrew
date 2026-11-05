// Interconnected sales pipeline: routing → lead → memory → booking → payment → CAPI → nurture.
import "server-only";
import crypto from "node:crypto";
import { RISE_MME, RISE_PAGE_ASSET, RISE_VENDOR_ID, waNumbers } from "./brand";
import { uid, type Workspace, type Lead, type Channel, type Stage } from "./schema";
const sha = (s: string) => crypto.createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
export function audit(w: Workspace, actor: string, action: string, detail: string) { w.audit.unshift({ id: uid("a"), at: new Date().toISOString(), actor, action, detail }); w.audit = w.audit.slice(0, 500); }
/** Explicit channel id → vendor. Empty string means "no id match" so keyword rules can still run. */
export function matchInboundVendor(w: Workspace, m: { channel: string; to?: string }): string {
  const to = m.to ?? "";
  const rise = w.vendors.find((v) => v.id === RISE_VENDOR_ID || v.name === "Rise & Eat");
  const byId = w.vendors.find((v) => waNumbers(v).some((n) => n.phoneNumberId && n.phoneNumberId === to) || v.channels.whatsapp?.phoneNumberId === to || v.channels.messenger?.pageId === to || v.channels.messenger?.mmeId === to || v.channels.instagram?.igUserId === to);
  if (byId) return byId.id;
  if (m.channel === "whatsapp" && rise && to && process.env.WHATSAPP_PHONE_NUMBER_ID && to === process.env.WHATSAPP_PHONE_NUMBER_ID) return rise.id;
  if (m.channel === "messenger" && rise && (to === RISE_PAGE_ASSET || to === RISE_MME || (!!process.env.META_PAGE_ID && to === process.env.META_PAGE_ID))) return rise.id;
  if (m.channel === "messenger") { const connected = w.vendors.filter((v) => v.channels.messenger?.status === "connected" && (v.channels.messenger.pageId || v.channels.messenger.mmeId)); if (connected.length === 1) return connected[0].id; }
  if (m.channel === "instagram" && rise && to && process.env.IG_USER_ID && to === process.env.IG_USER_ID) return rise.id;
  if (m.channel === "instagram") { const connected = w.vendors.filter((v) => v.channels.instagram?.handle && v.channels.instagram.status === "connected"); if (connected.length === 1) return connected[0].id; }
  if (m.channel === "whatsapp" && rise) { const connected = w.vendors.filter((v) => v.channels.whatsapp?.status === "connected"); if (connected.length === 1 && connected[0].id === rise.id && to) return rise.id; }
  return "";
}
export function routeVendor(w: Workspace, o: { channel?: Channel; text?: string; campaignId?: string; to?: string }) {
  if (o.to) { const id = matchInboundVendor(w, { channel: o.channel ?? "", to: o.to }); if (id) return id; }
  const rules = w.rules.filter((r) => r.active).sort((a, b) => a.priority - b.priority);
  for (const r of rules) { const c = r.when;
    if (c.campaignId && c.campaignId !== o.campaignId) continue; if (c.channel && c.channel !== o.channel) continue;
    if (c.keyword && !new RegExp(c.keyword, "i").test(o.text ?? "")) continue; if (!c.campaignId && !c.channel && !c.keyword) continue; return r.assignVendorId; }
  return w.vendors.find((v) => v.active)?.id ?? w.vendors[0].id;
}
export function scoreLead(l: Lead) { let s = 30; if (l.email) s += 10; if (l.phone) s += 10; if (l.company) s += 10; if (l.customerType === "B2B" || l.customerType === "Reseller") s += 10;
  if (/need|price|how much|book|order|nawa|elo|ego ole|abeg/i.test(l.note)) s += 15; if (l.productIds.length) s += 5; return Math.min(99, s); }
export function setStage(w: Workspace, leadId: string | undefined, stage: Stage) { const l = w.leads.find((x) => x.id === leadId); if (l) { const order: Stage[] = ["new", "contacted", "qualified", "proposal", "won", "paid", "nurture"]; if (order.indexOf(stage) > order.indexOf(l.stage) || stage === "lost") l.stage = stage; l.lastTouch = new Date().toISOString(); } }
export function remember(w: Workspace, vendorId: string, leadId: string | undefined, kind: "fact" | "preference" | "objection" | "promise" | "outcome" | "insight", text: string, scope: "short" | "long" = "short") {
  w.memory.unshift({ id: uid("m"), vendorId, leadId, scope, kind, text, at: new Date().toISOString(), ttlHours: scope === "short" ? 72 : undefined }); w.memory = w.memory.slice(0, 2000); }
export const memoryFor = (w: Workspace, leadId?: string) => w.memory.filter((m) => m.leadId === leadId && (m.scope === "long" || !m.ttlHours || Date.now() - +new Date(m.at) < m.ttlHours * 3600e3)).slice(0, 8).map((m) => `${m.kind}: ${m.text}`);
const CAPI_MAP: Record<string, string> = { lead: "Lead", contacted: "Contact", booked: "Schedule", proposal: "InitiateCheckout", checkout: "InitiateCheckout", contact: "Contact", paid: "Purchase", won: "Purchase", subscribe: "Subscribe" };
export async function capi(w: Workspace, vendorId: string, ev: string, leadId?: string, value?: number, currency?: string, actionSource = "system_generated") {
  const name = CAPI_MAP[ev] ?? ev; const l = w.leads.find((x) => x.id === leadId);
  const pixel = w.settings.capi.pixelId || process.env.META_PIXEL_ID; const token = process.env.META_CAPI_TOKEN;
  const payload = { data: [{ event_name: name, event_time: Math.floor(Date.now() / 1000), action_source: actionSource, event_id: uid("ev"),
    user_data: { em: l?.email ? [sha(l.email)] : undefined, ph: l?.phone ? [sha(l.phone.replace(/\D/g, ""))] : undefined, fn: l?.name ? [sha(l.name.split(" ")[0])] : undefined, external_id: leadId ? [sha(leadId)] : undefined },
    custom_data: { value: value ?? l?.value ?? 0, currency: currency ?? "NGN", lead_id: leadId, vendor_id: vendorId, salescrew_event: ev } }], test_event_code: w.settings.capi.testEventCode || undefined };
  let status: "sent" | "dry-run" | "failed" = "dry-run"; let response = "Dry-run: set META_PIXEL_ID (or Settings → CAPI pixel) + META_CAPI_TOKEN to send live";
  if (pixel && token) { try { const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
    status = r.ok ? "sent" : "failed"; response = JSON.stringify(await r.json().catch(() => ({}))).slice(0, 400); } catch (e) { status = "failed"; response = (e as Error).message; } }
  w.capi.unshift({ id: uid("ce"), vendorId, name, leadId, value: payload.data[0].custom_data.value, currency: payload.data[0].custom_data.currency, at: new Date().toISOString(), status, response, actionSource }); w.capi = w.capi.slice(0, 500);
  return { status, payload, response };
}
