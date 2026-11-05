// Engagements: people who liked, commented, messaged or called. Reply publicly to comments, send a private DM (Meta private replies), or auto-engage all new ones with AI.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { draftFor, act } from "@/lib/engage";
import { audit } from "@/lib/pipeline";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); let res: unknown = null;
  const w = await mutate(ws, async (w) => { const list = (w.engagements ??= []);
    if (b.action === "draft") { const e = list.find((x) => x.id === b.id); if (e) res = { text: await draftFor(w, e, b.lang) }; return; }
    if (b.action === "ignore") { const e = list.find((x) => x.id === b.id); if (e) e.status = "ignored"; return; }
    if (b.action === "act") { const e = list.find((x) => x.id === b.id); if (e) res = await act(w, e, b.mode ?? "reply", b.text, b.lang); audit(w, "engage", `engage.${b.mode}`, e?.who ?? ""); return; }
    if (b.action === "auto") { const todo = list.filter((e) => e.status === "new" && e.kind !== "message" && e.kind !== "call" && (!b.vendorId || b.vendorId === "all" || e.vendorId === b.vendorId)).slice(0, 15); const r = [];
      for (const e of todo) r.push({ id: e.id, ...(await act(w, e, e.kind === "comment" ? "both" : "dm", undefined, b.lang)) }); res = { done: r.length, results: r }; audit(w, "engage", "engage.auto", `${r.length} engagers`); }
  });
  return Response.json({ result: res, engagements: w.engagements ?? [] });
}
