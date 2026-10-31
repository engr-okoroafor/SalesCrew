import { complete, type Provider } from "@/lib/ai";
import { SYSTEM_SCOPE, SLOTS } from "@/lib/data";
const OUT_OF_SCOPE = /(politic|election|bitcoin|crypto|medical|diagnos|lawyer|homework|write me a poem|who is the president)/i;
export type Turn = { from: string; text: string };
// Task-scoped, inbound-only agent reply shared by the demo (/api/assist) and live Meta webhooks.
export async function agentReply(channel: string, turns: Turn[], provider: Provider = "meta") {
  const history = turns.slice(-10).map((m) => ({ role: (m.from === "customer" ? "user" : "assistant") as "user" | "assistant", content: String(m.text).slice(0, 800) }));
  const last = String(history.at(-1)?.content ?? "");
  if (/^\s*human\s*$/i.test(last)) return { text: "Connecting you to Amaka now 🙋🏾‍♀️ — she'll reply here shortly. (Agent paused on this thread.)", handoff: true, provider: "rule", model: "handoff-policy", booked: null as string | null };
  if (OUT_OF_SCOPE.test(last)) return { text: "Sorry, I can only help with Amaka's Oven orders, prices, delivery and bookings. Reply HUMAN anytime to talk to Amaka.", handoff: true, provider: "rule", model: "scope-guard", booked: null as string | null };
  const sys = `${SYSTEM_SCOPE}\nChannel: ${channel}. Open booking slots: ${SLOTS.join(", ")}. When a booking is requested, offer exactly two open slots on or before the day the customer needs it; when the customer picks one, confirm it and end with the token [BOOKED:<slot>].`;
  const r = await complete([{ role: "system", content: sys }, ...history], { max: 300, prefer: provider, offline: "Yes we can! Chocolate 6-inch is ₦25,000. I have Sat 09:00 or Sat 12:00 for pickup/delivery — which works? Reply HUMAN anytime to talk to Amaka." });
  const m = r.text.match(/\[BOOKED:([^\]]+)\]/);
  return { ...r, handoff: false, text: r.text.replace(/\[BOOKED:[^\]]+\]/, "").trim(), booked: m?.[1]?.trim() ?? null };
}
