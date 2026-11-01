// Paystack (x-paystack-signature HMAC-SHA512) + Stripe (stripe-signature) webhooks → mark paid → CAPI Purchase → nurture.
import crypto from "node:crypto";
import { mutate } from "@/lib/store";
import { capi, remember, setStage, audit } from "@/lib/pipeline";
export async function POST(req: Request) {
  const raw = await req.text(); let ws = "", ref = "", ok = false;
  const ps = req.headers.get("x-paystack-signature"); const ss = req.headers.get("stripe-signature");
  if (ps && process.env.PAYSTACK_SECRET_KEY) { const h = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex"); if (h !== ps) return new Response("bad sig", { status: 401 });
    const j = JSON.parse(raw); ok = j.event === "charge.success"; ref = j.data?.reference; ws = j.data?.metadata?.ws; }
  else if (ss && process.env.STRIPE_WEBHOOK_SECRET) { const parts = Object.fromEntries(ss.split(",").map((p) => p.split("="))); const h = crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${parts.t}.${raw}`).digest("hex");
    if (h !== parts.v1) return new Response("bad sig", { status: 401 }); const j = JSON.parse(raw); ok = j.type === "checkout.session.completed"; ref = j.data?.object?.metadata?.ref; ws = j.data?.object?.metadata?.ws; }
  else return new Response("unconfigured", { status: 400 });
  if (ok && ws && ref) await mutate(ws, async (w) => { const p = w.payments.find((x) => x.ref === ref); if (!p) return; p.status = "paid"; setStage(w, p.leadId, "paid");
    remember(w, p.vendorId, p.leadId, "outcome", `Paid ${p.currency} ${p.amount} (${ref}) — start post-sale nurture: thank-you, review ask, upsell in 14 days`, "long");
    await capi(w, p.vendorId, "paid", p.leadId, p.amount, p.currency, "website"); audit(w, "pay", "payment.paid", ref); });
  return Response.json({ received: true });
}
