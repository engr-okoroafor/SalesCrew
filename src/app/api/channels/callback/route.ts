// Facebook Login for Business callback: exchange code → long-lived user token → pages (+page tokens) → IG business account → WABA phone numbers. Saves per-vendor & registers webhook routes.
import { mutate, loadGlobal, saveGlobal } from "@/lib/store";
import { GRAPH } from "@/lib/meta";
import crypto from "node:crypto";
const sign = (s: string) => crypto.createHmac("sha256", process.env.AUTH_SECRET ?? process.env.META_APP_SECRET ?? "dev").update(s).digest("hex").slice(0, 16);
export async function GET(req: Request) {
  const u = new URL(req.url); const code = u.searchParams.get("code"); const [ws, vendorId, sig] = (u.searchParams.get("state") ?? "").split(".");
  const back = (q: string) => Response.redirect(`${u.origin}/app/settings?tab=channels&${q}`, 302);
  if (!code || !ws || sign(`${ws}.${vendorId}`) !== sig) return back("connect=error&reason=state");
  try {
    const t = await (await fetch(`${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: process.env.META_APP_ID!, client_secret: process.env.META_APP_SECRET!, redirect_uri: `${u.origin}/api/channels/callback`, code })}`)).json();
    if (!t.access_token) return back("connect=error&reason=token");
    const ll = await (await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${t.access_token}`)).json();
    const ut = ll.access_token ?? t.access_token;
    const pages = (await (await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${ut}`)).json()).data ?? [];
    const biz = (await (await fetch(`${GRAPH}/me/businesses?fields=id,owned_whatsapp_business_accounts{id,phone_numbers{id,display_phone_number}}&access_token=${ut}`)).json()).data ?? [];
    const waba = biz.flatMap((b: any) => b.owned_whatsapp_business_accounts?.data ?? [])[0]; const phones = waba?.phone_numbers?.data ?? []; const phone = phones[0];
    const p = (vendorId === "v_amaka" ? pages.find((x: { id: string }) => x.id === "265491983319446") : null) ?? pages[0]; const g = await loadGlobal();
    await mutate(ws, async (w) => { const v = w.vendors.find((x) => x.id === vendorId); if (!v) return; v.tokens = v.tokens ?? {};
      if (p) { const known = p.id === "265491983319446"; v.channels.messenger = { pageId: p.id, pageName: known ? "Rise & Eat" : p.name, mmeId: known ? "61558190371192" : v.channels.messenger?.mmeId, status: "connected" }; v.tokens.messenger = p.access_token; g.routes[p.id] = { workspaceId: ws, vendorId }; if (known) g.routes["61558190371192"] = { workspaceId: ws, vendorId };
        await fetch(`${GRAPH}/${p.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${p.access_token}`, { method: "POST" }).catch(() => null);
        if (p.instagram_business_account) { v.channels.instagram = { igUserId: p.instagram_business_account.id, handle: p.instagram_business_account.username, status: "connected" }; v.tokens.instagram = p.access_token; g.routes[p.instagram_business_account.id] = { workspaceId: ws, vendorId }; } }
      if (phones.length) { const numbers = phones.map((p: { id: string; display_phone_number: string }) => ({ phoneNumberId: p.id, wabaId: waba.id, display: p.display_phone_number, status: "connected" as const })); const kept = (v.channels.whatsapp?.numbers ?? []).filter((n) => !numbers.some((a: { display: string }) => a.display?.replace(/\D/g, "") === (n.display ?? "").replace(/\D/g, ""))); v.channels.whatsapp = { phoneNumberId: phone.id, wabaId: waba.id, display: phone.display_phone_number, status: "connected", numbers: [...numbers, ...kept] }; v.tokens.whatsapp = ut; for (const p of phones) g.routes[p.id] = { workspaceId: ws, vendorId };
        await fetch(`${GRAPH}/${waba.id}/subscribed_apps?access_token=${ut}`, { method: "POST" }).catch(() => null); } });
    await saveGlobal(g); return back(`connect=ok&pages=${pages.length}&wa=${phone ? 1 : 0}&ig=${p?.instagram_business_account ? 1 : 0}`);
  } catch { return back("connect=error&reason=exception"); }
}
