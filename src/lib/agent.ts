import { complete, type Provider } from "@/lib/ai";
import type { Workspace, Vendor } from "./schema";
const BENCH = `Competitor anchors for items with no printed Rise & Eat price (Port Harcourt / Lagos, say it is a market benchmark the team can confirm — never call it the official menu): small chops tray of about 50 pieces ₦18,000–₦35,000 (quote ₦25,000); homemade loaf ₦1,800–₦3,500 (quote ₦2,500); pastry or snack ₦500–₦1,500 and popcorn tub ₦1,500–₦3,000; yogurt or parfait cup ₦2,000–₦4,500 (quote ₦3,000); fresh juice 500ml ₦1,500–₦3,500 and tiger-nut juice ₦1,200–₦2,800 (quote ₦2,000); dried nuts and fruits pack ₦3,500–₦8,000 (quote ₦5,000); takeaway soup or stew per litre ₦3,500–₦8,000 (quote ₦5,000); cereal pack ₦3,000–₦7,500 and organic honey jar ₦4,500–₦12,000; food tray ₦8,000–₦25,000 (quote ₦15,000); gift hamper ₦8,000–₦40,000 (quote ₦15,000); cakes for events, 6-inch ₦18,000–₦35,000 (quote ₦25,000) and tiered wedding cakes well above that; catering per guest ₦4,500–₦12,000; event planning from ₦150,000 depending on size; baking class ₦25,000–₦75,000 per person (quote ₦45,000); baking ingredients such as flour 2kg ₦2,500–₦5,500 and butter ₦3,500–₦8,000. Scale the quote to the quantity asked.`;
export function autoSendOn(w: Workspace, c: { aiOn: boolean; vendorId: string }) {
  const v = w.vendors.find((x) => x.id === c.vendorId);
  return !!c.aiOn && !!w.settings.ai.autoReply && v?.autoReply !== false;
}
const OUT_OF_SCOPE = /(politic|election|bitcoin price|medical|diagnos|lawyer|homework|write me a poem|who is the president)/i;
export type Turn = { from: string; text: string };
export function freeSlots(w: Workspace, vendorId: string, n = 6) {
  const s = w.settings.calls; const out: string[] = []; const t = new Date(); t.setMinutes(0, 0, 0); t.setHours(t.getHours() + 2);
  const [sh] = s.workingHours.start.split(":").map(Number); const [eh] = s.workingHours.end.split(":").map(Number);
  const taken = new Set(w.bookings.filter((b) => b.vendorId === vendorId && b.status !== "cancelled").map((b) => new Date(b.start).toISOString().slice(0, 13)));
  for (let i = 0; i < 24 * 14 && out.length < n; i++) { const d = new Date(t.getTime() + i * 3600e3);
    if (!s.workingHours.days.includes(d.getDay()) || d.getHours() < sh || d.getHours() >= eh) continue; if (taken.has(d.toISOString().slice(0, 13))) continue; out.push(d.toISOString()); i += 2; }
  return out;
}
export const fmtSlot = (iso: string) => new Date(iso).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
export function vendorScope(w: Workspace, v: Vendor) {
  const prods = w.products.filter((p) => p.vendorId === v.id);
  const priced = prods.filter((p) => p.price > 0).map((p) => `${p.name} (${p.kind}) ${p.currency === "NGN" ? "₦" : "$"}${p.price.toLocaleString()}${p.leadTime ? `, lead time ${p.leadTime}` : ""}`).join("; ");
  const open = prods.filter((p) => !(p.price > 0)).map((p) => p.name).join(", ");
  return `You are the AI sales & customer-service agent for ${v.name} (${v.industry}, ${v.city}). Persona: ${v.persona}. You ONLY reply to people who messaged first, and only about this business's catalog, prices, orders, delivery, payments and bookings. Confirmed prices (quote these exactly): ${priced || "none"}. ${open ? `No printed price for: ${open}. Do not say you don't know and do not invent an official menu price. Benchmark Nigerian competitors and quote.\n${BENCH}` : ""} Hours: ${v.hours}. Detect the customer's language (English, Nigerian Pidgin, Igbo, Yoruba, Hausa, or others) and reply in the same language/mix. If they show interest in one item, briefly suggest ONE relevant complementary item (upsell) when natural. If off-topic, decline politely and offer a human. End with: "Reply ${w.settings.ai.humanHandoffKeyword} anytime to talk to a person." Max ${w.settings.ai.replyMaxWords} words.${v.logo ? `\nBrand logo: ${v.logo}.` : ""}${v.knowledge ? `\nBusiness knowledge base (authoritative — answer questions about the business from this; if it isn't here, say you'll confirm with the team):\n${v.knowledge.slice(0, 12000)}` : ""}${(v.bank ?? w.settings.payments.bank ?? []).length ? `\nDirect payment option (share only when the customer asks to pay by transfer/cash): ${(v.bank ?? w.settings.payments.bank ?? []).map((a) => `${a.bank} · ${a.accountName} · ${a.accountNumber} (${a.currency})`).join("; ")}.` : ""}`;
}
export async function agentReply(w: Workspace, vendorId: string, channel: string, turns: Turn[], provider: Provider = "meta", memory: string[] = []) {
  const v = w.vendors.find((x) => x.id === vendorId) ?? w.vendors[0];
  const history = turns.slice(-12).map((m) => ({ role: (m.from === "customer" ? "user" : "assistant") as "user" | "assistant", content: String(m.text).slice(0, 800) }));
  const last = String(history.at(-1)?.content ?? "");
  const kw = w.settings.ai.humanHandoffKeyword;
  if (new RegExp(`^\\s*${kw}\\s*$`, "i").test(last)) return { text: `Connecting you to the ${v.name} team now 🙋🏾 — a person will reply here shortly.`, handoff: true, provider: "rule", model: "handoff-policy", booked: null as string | null, fallback: false };
  if (OUT_OF_SCOPE.test(last)) return { text: `Sorry, I can only help with ${v.name} products, orders, delivery and bookings. Reply ${kw} anytime to talk to a person.`, handoff: true, provider: "rule", model: "scope-guard", booked: null as string | null, fallback: false };
  const slots = freeSlots(w, v.id, 4);
  const sys = `${vendorScope(w, v)}\nChannel: ${channel}. Known memory about this customer: ${memory.join(" | ") || "none"}. Open booking slots: ${slots.map(fmtSlot).join(", ")}. When a booking is requested, offer two open slots; when the customer picks one, confirm and end with [BOOKED:<exact slot text>]. When they want to pay, say a secure payment link is coming and end with [PAY].`;
  const r = await complete([{ role: "system", content: sys }, ...history], { max: 320, prefer: provider, offline: `Thanks for reaching ${v.name}! I can help with prices, orders and bookings. Next open slots: ${slots.slice(0, 2).map(fmtSlot).join(" or ")}. Which works? Reply ${kw} anytime to talk to a person.` });
  const m = r.text.match(/\[BOOKED:([^\]]+)\]/); const pay = /\[PAY\]/.test(r.text);
  const bookedIso = m ? slots.find((s) => fmtSlot(s) === m[1].trim()) ?? slots[0] : null;
  return { ...r, handoff: false, pay, text: r.text.replace(/\[BOOKED:[^\]]+\]|\[PAY\]/g, "").trim(), booked: bookedIso };
}
