// Shared payment helpers: standard reference, provider auto-detection, mark-paid side effects, provider verification.
import type { Workspace } from "./schema";
import { capi, remember, setStage, audit } from "./pipeline";
export const paymentRef = (vendorId = "SC") => { const d = new Date(); const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `SC-${vendorId.replace(/^v_/, "").slice(0, 5).toUpperCase()}-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; };
export const providers = () => ({ paystack: !!process.env.PAYSTACK_SECRET_KEY, stripe: !!process.env.STRIPE_SECRET_KEY, paystackWebhook: !!process.env.PAYSTACK_SECRET_KEY, stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET });
export function pickProvider(currency: "NGN" | "USD", method?: string): "paystack" | "stripe" | "transfer" {
  if (method === "transfer" || method === "cash") return "transfer"; const p = providers();
  if (currency === "NGN") return p.paystack ? "paystack" : p.stripe ? "stripe" : "transfer";
  return p.stripe ? "stripe" : p.paystack ? "paystack" : "transfer";
}
export async function markPaid(w: Workspace, ref: string, via: string) {
  const p = w.payments.find((x) => x.ref === ref); if (!p || p.status === "paid") return false; p.status = "paid"; setStage(w, p.leadId, "paid");
  if (p.productId) { const pr = w.products.find((x) => x.id === p.productId); if (pr) pr.buyers = (pr.buyers ?? 0) + 1; }
  remember(w, p.vendorId, p.leadId, "outcome", `Paid ${p.currency} ${p.amount} (${ref}) via ${via} — start post-sale nurture: thank-you, review ask, upsell in 14 days`, "long");
  await capi(w, p.vendorId, "paid", p.leadId, p.amount, p.currency, "website"); audit(w, "pay", "payment.paid", `${ref} via ${via}`); return true;
}
export async function verifyWithProvider(ref: string, provider: string): Promise<boolean | null> {
  try {
    if (provider === "paystack" && process.env.PAYSTACK_SECRET_KEY) { const j = await (await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } })).json(); return j.data?.status === "success"; }
    if (provider === "stripe" && process.env.STRIPE_SECRET_KEY) { const j = await (await fetch(`https://api.stripe.com/v1/checkout/sessions?limit=20`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } })).json();
      const s = (j.data ?? []).find((x: { client_reference_id?: string }) => x.client_reference_id === ref); return s ? s.payment_status === "paid" : false; }
  } catch { /* network */ } return null;
}
