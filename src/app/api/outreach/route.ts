// Send approved outreach drafts: WhatsApp/Messenger/IG via Graph (24h/template rules apply), email via RESEND_API_KEY. Otherwise recorded as dry-run.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { sendMessage } from "@/lib/meta";
import { uid } from "@/lib/schema";
import { setStage, remember, audit } from "@/lib/pipeline";
export async function POST(req: Request) {
  const { drafts, channel } = await req.json(); const ws = await workspaceId(); const results: { leadId: string; status: string }[] = [];
  const w = await mutate(ws, async (w) => { for (const d of drafts as { leadId: string; subject?: string; body: string; upsell?: string[] }[]) { const l = w.leads.find((x) => x.id === d.leadId); if (!l) continue; let status: "sent" | "dry-run" = "dry-run";
    if (channel === "email" && l.email && process.env.RESEND_API_KEY) { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.OUTREACH_FROM ?? "SalesCrew <onboarding@resend.dev>", to: l.email, subject: d.subject ?? "Hello", text: `${d.body}\n\n${w.settings.outreach.signature}` }) }); if (r.ok) status = "sent"; }
    else if (channel === "whatsapp" && l.phone) { const r = await sendMessage("whatsapp", l.phone.replace(/\D/g, ""), d.body); if (r.ok) status = "sent"; }
    w.outreach.unshift({ id: uid("o"), vendorId: l.vendorId, leadId: l.id, channel, subject: d.subject, body: d.body, status, upsell: d.upsell, at: new Date().toISOString() });
    setStage(w, l.id, "contacted"); remember(w, l.vendorId, l.id, "promise", `Outreach via ${channel}${d.upsell?.length ? `; upsell pitched: ${d.upsell.join(", ")}` : ""}`); results.push({ leadId: l.id, status }); }
    audit(w, "outreach", "outreach.send", `${results.length} via ${channel}`); });
  return Response.json({ results, outreach: w.outreach.slice(0, 100), leads: w.leads });
}
