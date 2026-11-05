// Paystack (x-paystack-signature HMAC-SHA512) + Stripe (stripe-signature) webhooks → mark paid → product buyers++ → CAPI Purchase → nurture.
import crypto from "node:crypto";
import { mutate } from "@/lib/store";
import { markPaid } from "@/lib/payments";
export async function POST(req: Request) {
  const raw = await req.text(); let ws = "", ref = "", ok = false, via = "";
  const ps = req.headers.get("x-paystack-signature"); const ss = req.headers.get("stripe-signature");
  if (ps && process.env.PAYSTACK_SECRET_KEY) { const h = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex"); if (h !== ps) return new Response("bad sig", { status: 401 });
    const j = JSON.parse(raw); ok = j.event === "charge.success"; ref = j.data?.reference; ws = j.data?.metadata?.ws; via = "paystack webhook"; }
  else if (ss && process.env.STRIPE_WEBHOOK_SECRET) { const parts = Object.fromEntries(ss.split(",").map((p) => p.split("="))); const h = crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${parts.t}.${raw}`).digest("hex");
    if (h !== parts.v1) return new Response("bad sig", { status: 401 }); const j = JSON.parse(raw); ok = j.type === "checkout.session.completed"; ref = j.data?.object?.metadata?.ref ?? j.data?.object?.client_reference_id; ws = j.data?.object?.metadata?.ws; via = "stripe webhook"; }
  else return new Response("unconfigured", { status: 400 });
  if (ok && ws && ref) await mutate(ws, (w) => markPaid(w, ref, via).then(() => undefined));
  return Response.json({ received: true });
}
