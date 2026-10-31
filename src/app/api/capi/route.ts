import { createHash } from "crypto";
const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
// Builds a Meta Conversions API payload. Live send only if META_PIXEL_ID + META_CAPI_TOKEN are set; otherwise dry-run.
export async function POST(req: Request) {
  const { event, email, phone, value, leadId } = await req.json();
  const name = event === "job_won" ? "Purchase" : event === "meeting_booked" ? "Schedule" : "Lead";
  const payload = { data: [{ event_name: name, event_time: Math.floor(Date.now() / 1000), action_source: "system_generated", custom_data: { salescrew_event: event, currency: "NGN", value: Number(value ?? 0), lead_id: leadId },
    user_data: { em: email ? [sha(email)] : undefined, ph: phone ? [sha(String(phone).replace(/\D/g, ""))] : undefined } }] };
  const pixel = process.env.META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return Response.json({ mode: "dry-run", endpoint: "POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events", payload });
  const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return Response.json({ mode: "live", status: r.status, response: await r.json().catch(() => null), payload });
}
