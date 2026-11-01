// Payments: Paystack (NGN, primary) + Stripe (USD) hosted checkout, auto-detected from env keys; bank transfer / cash path with admin confirmation.
// Standard reference: SC-<VENDOR>-<YYMMDD>-<RAND>. GET ?ref= verifies with the provider and marks paid (webhook remains the source of truth).
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { uid } from "@/lib/schema";
import { audit, setStage, remember } from "@/lib/pipeline";
import { paymentRef, pickProvider, providers, markPaid, verifyWithProvider } from "@/lib/payments";
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref"); const ws = await workspaceId();
  if (!ref) return Response.json({ providers: providers() });
  const w = await loadWorkspace(ws); const p = w.payments.find((x) => x.ref === ref); if (!p) return Response.json({ error: "unknown ref" }, { status: 404 });
  if (p.status === "paid") return Response.json({ ref, status: "paid" });
  const ok = await verifyWithProvider(ref, p.provider); if (ok) await mutate(ws, async (w) => { await markPaid(w, ref, `${p.provider} verify`); });
  return Response.json({ ref, status: ok ? "paid" : p.status, verified: ok });
}
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w = await loadWorkspace(ws);
  if (b.action === "confirm") { // admin confirms a transfer / cash payment received
    const nw = await mutate(ws, async (w) => { await markPaid(w, b.ref, b.via ?? "bank transfer (admin confirmed)"); }); return Response.json({ ok: true, workspace: { payments: nw.payments, leads: nw.leads, products: nw.products } }); }
  const lead = w.leads.find((l) => l.id === b.leadId); const product = w.products.find((p) => p.id === b.productId);
  const vendorId = lead?.vendorId ?? product?.vendorId ?? b.vendorId ?? w.vendors[0].id; const vendor = w.vendors.find((v) => v.id === vendorId);
  const currency: "NGN" | "USD" = b.currency ?? product?.currency ?? vendor?.currency ?? w.settings.payments.defaultCurrency;
  const amount = Number(b.amount ?? String(b.price ?? "").replace(/[^\d.]/g, "")) || product?.price || lead?.value || 0; const ref = paymentRef(vendorId);
  const email = b.email ?? lead?.email ?? "customer@example.com"; const origin = new URL(req.url).origin; const provider = pickProvider(currency, b.method);
  let url: string | undefined; let mode = "dry-run"; let message = ""; let bank = undefined as undefined | typeof w.settings.payments.bank;
  try {
    if (provider === "paystack") { const r = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: Math.round(amount * 100), currency, reference: ref, callback_url: `${origin}/pay/${ref}`, metadata: { ws, leadId: b.leadId, vendorId, productId: product?.id } }) });
      const j = await r.json(); url = j.data?.authorization_url; mode = url ? "live" : "error"; message = j.message; }
    else if (provider === "stripe") { const f = new URLSearchParams({ mode: "payment", success_url: `${origin}/pay/${ref}`, cancel_url: `${origin}/pay/${ref}?cancelled=1`, customer_email: email, client_reference_id: ref, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": currency.toLowerCase(), "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)), "line_items[0][price_data][product_data][name]": product?.name ?? b.item ?? "Order", "metadata[ws]": ws, "metadata[leadId]": b.leadId ?? "", "metadata[ref]": ref });
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, body: f }); const j = await r.json(); url = j.url; mode = url ? "live" : "error"; message = j.error?.message ?? ""; }
    else { bank = (vendor?.bank?.length ? vendor.bank : w.settings.payments.bank ?? []).filter((a) => a.currency === currency); if (!bank.length) bank = vendor?.bank?.length ? vendor.bank : w.settings.payments.bank ?? [];
      mode = "transfer"; url = `${origin}/pay/${ref}`; message = b.method ? `Direct ${b.method} payment — share the reference ${ref}; confirm in Admin → Payments when received.` : "No PAYSTACK_SECRET_KEY / STRIPE_SECRET_KEY set — using bank transfer page. Add a key to enable card checkout."; }
  } catch (e) { mode = "error"; message = (e as Error).message; }
  const nw = await mutate(ws, (w) => { w.payments.unshift({ id: uid("pay"), vendorId, leadId: b.leadId, productId: product?.id, provider, method: provider === "transfer" ? (b.method === "cash" ? "cash" : "transfer") : "card", amount, currency, status: provider === "transfer" ? "pending-confirmation" : "initiated", ref, url, at: new Date().toISOString() });
    if (b.leadId) setStage(w, b.leadId, "proposal"); if (lead) remember(w, lead.vendorId, lead.id, "promise", `Payment ${ref} sent (${currency} ${amount}, ${provider})`); audit(w, "pay", "payment.init", `${ref} ${provider} ${mode}`); });
  return Response.json({ ok: true, ref, url, mode, provider, message, bank, workspace: { payments: nw.payments } });
}
