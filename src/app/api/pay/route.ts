// Payments: Paystack (NGN) + Stripe (USD) hosted checkout. Dry-run link when keys absent.
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { uid } from "@/lib/schema";
import { audit, setStage, remember } from "@/lib/pipeline";
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w = await loadWorkspace(ws);
  const lead = w.leads.find((l) => l.id === b.leadId); const currency: "NGN" | "USD" = b.currency ?? (lead ? w.vendors.find((v) => v.id === lead.vendorId)?.currency : undefined) ?? w.settings.payments.defaultCurrency;
  const amount = Number(b.amount ?? String(b.price ?? "").replace(/[^\d.]/g, "")) || lead?.value || 0; const ref = `SC-${Date.now().toString(36).toUpperCase()}`;
  const email = b.email ?? lead?.email ?? "customer@example.com"; const origin = new URL(req.url).origin;
  let url: string | undefined; let mode = "dry-run"; let message = "";
  try {
    if (currency === "NGN" && process.env.PAYSTACK_SECRET_KEY) { const r = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: Math.round(amount * 100), currency: "NGN", reference: ref, callback_url: `${origin}/app/bookings?paid=${ref}`, metadata: { ws, leadId: b.leadId, vendorId: lead?.vendorId } }) });
      const j = await r.json(); url = j.data?.authorization_url; mode = url ? "live" : "error"; message = j.message; }
    else if (currency === "USD" && process.env.STRIPE_SECRET_KEY) { const f = new URLSearchParams({ mode: "payment", success_url: `${origin}/app/bookings?paid=${ref}`, cancel_url: `${origin}/app/leads`, customer_email: email, client_reference_id: ref, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)), "line_items[0][price_data][product_data][name]": b.item ?? "Order", "metadata[ws]": ws, "metadata[leadId]": b.leadId ?? "", "metadata[ref]": ref });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, body: f }); const j = await r.json(); url = j.url; mode = url ? "live" : "error"; message = j.error?.message ?? ""; }
    else message = `Set ${currency === "NGN" ? "PAYSTACK_SECRET_KEY" : "STRIPE_SECRET_KEY"} to create live checkout links.`;
  } catch (e) { mode = "error"; message = (e as Error).message; }
  const nw = await mutate(ws, (w) => { w.payments.unshift({ id: uid("pay"), vendorId: lead?.vendorId ?? w.vendors[0].id, leadId: b.leadId, provider: currency === "NGN" ? "paystack" : "stripe", amount, currency, status: "initiated", ref, url, at: new Date().toISOString() });
    setStage(w, b.leadId, "proposal"); if (lead) remember(w, lead.vendorId, lead.id, "promise", `Payment link ${ref} sent (${currency} ${amount})`); audit(w, "pay", "payment.init", `${ref} ${mode}`); });
  return Response.json({ ok: true, ref, url, mode, message, workspace: { payments: nw.payments } });
}
