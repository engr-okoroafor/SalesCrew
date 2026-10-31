import { complete, prefer } from "@/lib/ai";
import { SYSTEM_SCOPE, SLOTS } from "@/lib/data";
export const maxDuration = 60;
const OUT_OF_SCOPE = /(politic|election|bitcoin|crypto|medical|diagnos|lawyer|homework|write me a poem|who is the president)/i;
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const history = (Array.isArray(b.history) ? b.history : []).slice(-10).map((m: { from: string; text: string }) => ({ role: m.from === "customer" ? "user" : "assistant", content: String(m.text).slice(0, 800) }));
  const last = String(history.at(-1)?.content ?? "");
  if (/^\s*human\s*$/i.test(last)) return Response.json({ text: "Connecting you to Amaka now 🙋🏾‍♀️ — she'll reply here shortly. (Agent paused on this thread.)", handoff: true, provider: "rule", model: "handoff-policy" });
  if (OUT_OF_SCOPE.test(last)) return Response.json({ text: "Sorry, I can only help with Amaka's Oven orders, prices, delivery and bookings. Reply HUMAN anytime to talk to Amaka.", handoff: true, provider: "rule", model: "scope-guard" });
  const sys = `${SYSTEM_SCOPE}\nChannel: ${b.channel ?? "whatsapp"}. Open booking slots: ${SLOTS.join(", ")}. When a booking is requested, offer exactly two open slots on or before the day the customer needs it; when the customer picks one, confirm it and end with the token [BOOKED:<slot>].`;
  const r = await complete([{ role: "system", content: sys }, ...history], { max: 300, prefer: prefer(b.provider), offline: "Yes we can! Chocolate 6-inch is ₦25,000. I have Sat 09:00 or Sat 12:00 for pickup/delivery — which works? Reply HUMAN anytime to talk to Amaka." });
  const m = r.text.match(/\[BOOKED:([^\]]+)\]/);
  return Response.json({ ...r, text: r.text.replace(/\[BOOKED:[^\]]+\]/, "").trim(), booked: m?.[1]?.trim() ?? null });
}
