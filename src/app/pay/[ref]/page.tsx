// Public payment page: status for a standard SC- reference, verifies card payments with the provider, shows bank-transfer details for direct payment.
import { loadGlobal, loadWorkspace, mutate } from "@/lib/store";
import type { Payment, Workspace } from "@/lib/schema";
import { markPaid, verifyWithProvider } from "@/lib/payments";
export const dynamic = "force-dynamic";
export default async function Pay({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params; const g = await loadGlobal(); let ws = ""; let p: Payment | undefined; let w: Workspace | undefined;
  for (const x of [...g.workspaces.map((y) => y.id), "demo"]) { const doc = await loadWorkspace(x); const f = doc.payments.find((q) => q.ref === ref); if (f) { ws = x; p = f; w = doc; break; } }
  if (!p || !w) return <main className="grid min-h-screen place-items-center p-6"><div className="glass p-8 text-center">Unknown payment reference <b>{ref}</b>.</div></main>;
  if (p.status !== "paid" && p.provider !== "transfer" && (await verifyWithProvider(ref, p.provider))) { await mutate(ws, (w) => markPaid(w, ref, "provider return").then(() => undefined)); p = { ...p, status: "paid" as const }; }
  const v = w.vendors.find((x) => x.id === p.vendorId); const bank = (v?.bank?.length ? v.bank : w.settings.payments.bank ?? []); const prod = w.products.find((x) => x.id === p.productId);
  const amt = `${p.currency === "NGN" ? "₦" : "$"}${p.amount.toLocaleString()}`;
  return <main className="grid min-h-screen place-items-center p-4"><div className="glass glass-hi w-full max-w-md space-y-4 p-6">
    <div className="text-sm text-white/50">{v?.name ?? "SalesCrew"} · secure payment</div>
    <div className="text-3xl font-black">{amt}</div><div className="text-sm text-white/60">{prod?.name ?? "Order"} · Reference <b className="neon font-mono">{p.ref}</b></div>
    <div className={`chip ${p.status === "paid" ? "chip-on" : ""}`}>{p.status === "paid" ? "✓ Paid — thank you!" : p.status === "pending-confirmation" ? "Awaiting transfer confirmation" : "Awaiting payment"}</div>
    {p.status !== "paid" && p.provider !== "transfer" && p.url && !p.url.includes("/pay/") && <a href={p.url} className="btn w-full justify-center">Pay with {p.provider === "paystack" ? "Paystack" : "Stripe"} →</a>}
    {p.status !== "paid" && bank.length > 0 && <div className="space-y-2"><div className="label">Pay by bank transfer / cash</div>{bank.map((a, i) => <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><b>{a.bank}</b><div>{a.accountName}</div><div className="font-mono text-lg neon">{a.accountNumber}</div><div className="text-xs text-white/50">{a.currency}{a.note ? ` · ${a.note}` : ""}</div></div>)}
      <p className="text-xs text-white/50">Use <b>{p.ref}</b> as the transfer narration. The vendor confirms receipt and you get a WhatsApp receipt.</p></div>}
  </div></main>;
}
