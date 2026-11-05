// Send approved outreach. channel "auto" maps each lead to the channel they reached us on (latest conversation), so Messenger/IG go to the PSID/IGSID via Graph and WhatsApp to the number.
// Email via RESEND_API_KEY. Anything without credentials or a reachable id is recorded as dry-run.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { sendMessage, vendorCreds, type Channel as MetaCh } from "@/lib/meta";
import { uid, type Channel, type Lead, type Workspace } from "@/lib/schema";
import { setStage, remember, audit } from "@/lib/pipeline";
function leadChannel(w: Workspace, l: Lead): Channel { const c = w.conversations.filter((x) => x.leadId === l.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]; return (c?.channel ?? l.channel) as Channel; }
export async function POST(req: Request) {
  const { drafts, channel: pick } = await req.json(); const ws = await workspaceId(); const results: { leadId: string; status: string; channel: string; error?: string }[] = [];
  const w = await mutate(ws, async (w) => { for (const d of drafts as { leadId: string; subject?: string; body: string; upsell?: string[]; channel?: string }[]) { const l = w.leads.find((x) => x.id === d.leadId); if (!l) continue;
    const channel = (d.channel && d.channel !== "auto" ? d.channel : pick && pick !== "auto" ? pick : leadChannel(w, l)) as Channel; let status: "sent" | "dry-run" = "dry-run"; let error: string | undefined;
    const v = w.vendors.find((x) => x.id === l.vendorId); const conv = w.conversations.find((c) => c.leadId === l.id && c.channel === channel);
    if (channel === "email") { if (l.email && process.env.RESEND_API_KEY) { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.OUTREACH_FROM ?? "SalesCrew <onboarding@resend.dev>", to: l.email, subject: d.subject ?? "Hello", text: `${d.body}\n\n${w.settings.outreach.signature}` }) }); if (r.ok) status = "sent"; } }
    else { const to = channel === "whatsapp" ? (conv?.contactId && !/^l\d|^demo/.test(conv.contactId) ? conv.contactId : l.phone.replace(/\D/g, "")) : conv?.contactId;
      if (to && !/^l\d|^demo/.test(to)) { const mc = (["whatsapp", "messenger", "instagram"].includes(channel) ? channel : "whatsapp") as MetaCh; const r = await sendMessage(mc, to, d.body, vendorCreds(v, mc)); if (r.ok) status = "sent"; else error = (r as { error?: string }).error; } else error = channel === "whatsapp" ? "no phone" : `lead has not messaged on ${channel} yet (Meta requires an inbound thread)`;
      if (conv) { conv.messages.push({ id: uid("m"), from: "agent", text: d.body, at: new Date().toISOString(), status }); conv.updatedAt = new Date().toISOString(); } }
    w.outreach.unshift({ id: uid("o"), vendorId: l.vendorId, leadId: l.id, channel, subject: d.subject, body: d.body, status, upsell: d.upsell, at: new Date().toISOString() });
    setStage(w, l.id, "contacted"); remember(w, l.vendorId, l.id, "promise", `Outreach via ${channel}${d.upsell?.length ? `; upsell pitched: ${d.upsell.join(", ")}` : ""}`); results.push({ leadId: l.id, status, channel, error }); }
    audit(w, "outreach", "outreach.send", `${results.length} via ${pick ?? "auto"}`); });
  return Response.json({ results, outreach: w.outreach.slice(0, 100), leads: w.leads, conversations: w.conversations });
}
