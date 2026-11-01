// Call Lab: outbound/inbound AI calls. Live WA Calling when WA_CALLING_ENABLED=1, else AI-simulated conversation (multilingual) with auto-booking.
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { waCall } from "@/lib/meta";
import { complete, prefer } from "@/lib/ai";
import { parseJSON } from "@/lib/json";
import { freeSlots, fmtSlot } from "@/lib/agent";
import { uid, type Call } from "@/lib/schema";
import { LANGS } from "@/lib/voice";
import { capi, remember, setStage, audit } from "@/lib/pipeline";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w = await loadWorkspace(ws);
  const ids: string[] = b.leadIds ?? (b.leadId ? [b.leadId] : []); const lang = b.lang ?? w.settings.calls.defaultLang; const dir = b.direction ?? "outbound";
  const out: Call[] = [];
  for (const id of ids.length ? ids : [""]) {
    const lead = w.leads.find((l) => l.id === id); const v = w.vendors.find((x) => x.id === (lead?.vendorId ?? b.vendorId)) ?? w.vendors[0];
    const slots = freeSlots(w, v.id, 4); let live: unknown = null;
    if (b.live && lead?.phone) live = await waCall(lead.phone.replace(/\D/g, ""));
    const r = await complete([{ role: "system", content: `Simulate a realistic short ${dir} sales phone call for ${v.name} (${v.industry}). Agent is an AI voice agent. Language: ${LANGS[lang]?.name ?? "English"}${lang === "pcm" ? " with natural code-switching to English" : lang !== "en" ? " with some English code-switching" : ""}. Offer these free slots: ${slots.map(fmtSlot).join("; ")}. ${w.settings.calls.autoBook ? "If customer agrees, book the slot." : ""} Return JSON {"transcript":[{"speaker":"Agent"|"Customer","lang":"code","text":"original","tr":"English translation"}],"outcome":"one line","bookedSlotIndex":number|null,"durationSec":number}. 6-10 turns.` },
      { role: "user", content: `Customer: ${lead?.name ?? b.name ?? "Caller"} ${lead?.company ? "from " + lead.company : ""}. Interest: ${lead?.interests.join(", ") || lead?.note || "general enquiry"}.` }], { max: 1800, prefer: prefer(w.settings.ai.primary), offline: "" });
    const j = parseJSON<{ transcript?: Call["transcript"]; outcome?: string; bookedSlotIndex?: number | null; durationSec?: number }>(r.text, {});
    const transcript = j.transcript?.length ? j.transcript : [{ speaker: "Agent", lang, text: lang === "pcm" ? `Good afternoon ${lead?.name ?? ""}, na ${v.name} dey call. You get small time?` : `Hello ${lead?.name ?? ""}, this is the ${v.name} assistant. Do you have a minute?`, tr: `Hello, this is ${v.name}.` }, { speaker: "Customer", lang, text: "Yes, go ahead.", tr: "Yes, go ahead." }, { speaker: "Agent", lang: "en", text: `I can book you for ${fmtSlot(slots[0])}. Does that work?` }, { speaker: "Customer", lang: "en", text: "Yes, book it." }];
    const bi = j.transcript?.length ? j.bookedSlotIndex : 0; const call: Call = { id: uid("call"), vendorId: v.id, leadId: lead?.id, direction: dir, via: b.live ? "whatsapp" : w.settings.calls.voiceVia, lang, status: "done", transcript, outcome: j.outcome ?? (bi != null ? "Booked" : "Follow up"), at: new Date().toISOString(), durationSec: j.durationSec ?? 95 };
    await mutate(ws, async (w) => { if (bi != null && slots[bi] && w.settings.calls.autoBook) { const bid = uid("b"); w.bookings.push({ id: bid, vendorId: v.id, leadId: lead?.id, title: `${lead?.name ?? "Caller"} — Call Lab`, start: slots[bi], durationMin: w.settings.calls.slotMin, channel: "whatsapp", status: "confirmed", source: "call-lab" }); call.bookingId = bid; setStage(w, lead?.id, "qualified"); await capi(w, v.id, "booked", lead?.id, undefined, undefined, "phone_call"); }
      setStage(w, lead?.id, "contacted"); remember(w, v.id, lead?.id, "outcome", `Call (${LANGS[lang]?.name}): ${call.outcome}`); w.calls.unshift(call); audit(w, "call-lab", `call.${dir}`, `${lead?.name ?? "caller"} ${live ? "live" : "simulated"}`); });
    out.push({ ...call, ...(live ? { live } : {}) } as Call);
  }
  return Response.json({ calls: out, workspace: await loadWorkspace(ws), live: process.env.WA_CALLING_ENABLED === "1" });
}
