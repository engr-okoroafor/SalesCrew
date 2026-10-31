import { SLOTS } from "@/lib/data";
const g = globalThis as unknown as { __b?: { id: string; slot: string; who: string; channel: string; at: number }[] };
const bookings = (g.__b ??= [{ id: "b0", slot: "Mon 11:00", who: "RiverCare Clinic (tasting call)", channel: "email", at: Date.now() }]);
export async function GET() { return Response.json({ slots: SLOTS.filter((s) => !bookings.some((b) => b.slot === s)), bookings }); }
export async function POST(req: Request) {
  const { slot, who, channel } = await req.json();
  if (!SLOTS.includes(slot)) return Response.json({ error: "unknown slot" }, { status: 400 });
  if (bookings.some((b) => b.slot === slot)) return Response.json({ error: "slot taken" }, { status: 409 });
  const b = { id: crypto.randomUUID().slice(0, 8), slot, who: String(who ?? "Customer").slice(0, 60), channel: String(channel ?? "whatsapp"), at: Date.now() };
  bookings.push(b); return Response.json({ ok: true, booking: b });
}
