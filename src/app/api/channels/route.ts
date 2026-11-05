// Per-vendor channel connect. GET = status; POST {vendorId, action:"oauth"} → Facebook Login for Business URL; POST {action:"manual"} saves ids/tokens server-side.
import { workspaceId } from "@/lib/auth";
import { loadGlobal, saveGlobal, mutate } from "@/lib/store";
import { channelStatus } from "@/lib/meta";
import crypto from "node:crypto";
const SCOPES = "pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_messages,instagram_content_publish,business_management,whatsapp_business_management,whatsapp_business_messaging";
const sign = (s: string) => crypto.createHmac("sha256", process.env.AUTH_SECRET ?? process.env.META_APP_SECRET ?? "dev").update(s).digest("hex").slice(0, 16);
export async function GET() { return Response.json({ env: channelStatus(), igUserIdEnv: !!process.env.IG_USER_ID }); }
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const origin = new URL(req.url).origin;
  if (b.action === "oauth") { if (!process.env.META_APP_ID) return Response.json({ error: "META_APP_ID missing" }, { status: 400 });
    const state = `${ws}.${b.vendorId}`; const u = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    u.search = new URLSearchParams({ client_id: process.env.META_APP_ID, redirect_uri: `${origin}/api/channels/callback`, state: `${state}.${sign(state)}`, scope: SCOPES, ...(process.env.META_CONFIG_ID ? { config_id: process.env.META_CONFIG_ID } : {}) }).toString();
    return Response.json({ url: u.toString() }); }
  if (b.action === "manual") { const g = await loadGlobal();
    // Uniqueness: one WhatsApp number / Page / IG account maps to exactly one vendor (inbound routing must be unambiguous).
    const taken = b.id && g.routes[b.id]; if (taken && (taken.workspaceId !== ws || taken.vendorId !== b.vendorId)) return Response.json({ error: `That ${b.channel} id is already mapped to another vendor${taken.workspaceId === ws ? ` (${taken.vendorId})` : ""}. Each vendor needs its own number/page/handle.` }, { status: 409 });
    const w = await mutate(ws, (w) => { const v = w.vendors.find((x) => x.id === b.vendorId); if (!v) return; const c = b.channel as "whatsapp" | "messenger" | "instagram";
      if (c === "whatsapp") { const prev = v.channels.whatsapp; const list = [...(prev?.numbers ?? [])]; const display = b.display ?? prev?.display ?? ""; const entry = { phoneNumberId: b.id, display, wabaId: prev?.wabaId, status: "connected" as const }; const i = list.findIndex((n) => (b.id && n.phoneNumberId === b.id) || (display && n.display === display)); if (i >= 0) list[i] = { ...list[i], ...entry }; else list.push(entry); const primary = list.find((n) => n.phoneNumberId) ?? list[0]; v.channels.whatsapp = { ...prev, status: "connected", display: primary?.display ?? display, phoneNumberId: primary?.phoneNumberId ?? b.id, wabaId: prev?.wabaId, numbers: list }; }
      if (c === "messenger") v.channels.messenger = { ...v.channels.messenger, pageId: b.id, pageName: b.display ?? v.channels.messenger?.pageName, status: "connected" };
      if (c === "instagram") v.channels.instagram = { ...v.channels.instagram, igUserId: b.id, handle: b.display ?? v.channels.instagram?.handle, status: "connected" };
      for (const [k, r] of Object.entries(g.routes)) if (c !== "whatsapp" && r.workspaceId === ws && r.vendorId === v.id && k !== b.id && ((c === "messenger" && k === v.channels.messenger?.pageId) || (c === "instagram" && k === v.channels.instagram?.igUserId))) delete g.routes[k];
      if (c === "whatsapp") for (const n of v.channels.whatsapp?.numbers ?? []) if (n.phoneNumberId) g.routes[n.phoneNumberId] = { workspaceId: ws, vendorId: v.id };
      if (b.token) v.tokens = { ...(v.tokens ?? {}), [c]: b.token }; if (b.id) g.routes[b.id] = { workspaceId: ws, vendorId: v.id }; });
    await saveGlobal(g); return Response.json({ ok: true, vendors: w.vendors.map(({ tokens, ...v }) => ({ ...v, hasTokens: Object.keys(tokens ?? {}) })) }); }
  if (b.action === "disconnect") { const w = await mutate(ws, (w) => { const v = w.vendors.find((x) => x.id === b.vendorId); if (v) { (v.channels as Record<string, { status: string }>)[b.channel] = { status: "off" }; if (v.tokens) delete v.tokens[b.channel]; } }); return Response.json({ ok: true, vendors: w.vendors.map(({ tokens, ...v }) => v) }); }
  return Response.json({ error: "bad action" }, { status: 400 });
}
