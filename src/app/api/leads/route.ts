import { RAW_LEADS, type Lead } from "@/lib/data";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9@.]/g, "");
const phone = (p: string) => "+234" + p.replace(/\D/g, "").replace(/^(234|0)/, "");
export async function GET() {
  const seen = new Map<string, Lead>(); const out: Lead[] = [];
  for (const l of RAW_LEADS) {
    const c: Lead = { ...l, name: l.name.trim().replace(/\b\w/g, (x) => x.toUpperCase()), email: l.email.toLowerCase(), phone: phone(l.phone) };
    const k = norm(c.email) || c.phone;
    if (seen.has(k)) { const p = seen.get(k)!; p.note += ` · ${c.source}: ${c.note}`; p.score += 15; continue; }
    c.score = (c.source.includes("Lead Ad") ? 50 : 25) + (c.email ? 20 : 0) + (/(wedding|staff|event|office)/i.test(c.note) ? 20 : 5);
    seen.set(k, c); out.push(c);
  }
  return Response.json({ raw: RAW_LEADS.length, cleaned: out.length, merged: RAW_LEADS.length - out.length, leads: out.sort((a, b) => b.score - a.score) });
}
