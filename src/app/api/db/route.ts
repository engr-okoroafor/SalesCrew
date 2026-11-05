import { workspaceId, getSession } from "@/lib/auth";
import { loadWorkspace, mutate, backend } from "@/lib/store";
import { COLLECTIONS, type CollName } from "@/lib/schema";
import { audit, scoreLead } from "@/lib/pipeline";
export const dynamic = "force-dynamic";
const strip = (w: any) => ({ ...w, vendors: w.vendors.map(({ tokens, ...v }: any) => ({ ...v, hasTokens: Object.keys(tokens ?? {}) })) });
export async function GET() { const w = await loadWorkspace(await workspaceId()); return Response.json({ workspace: strip(w), backend: backend(), session: await getSession() }); }
// Generic CRUD: { op: "upsert"|"delete"|"settings"|"reset", coll, item | id | settings }
export async function POST(req: Request) {
  const b = await req.json(); const s = await getSession(); const actor = s?.email ?? "guest";
  const w = await mutate(await workspaceId(), async (w) => {
    if (b.op === "settings") { w.settings = { ...w.settings, ...b.settings }; if (b.name) w.name = b.name; audit(w, actor, "settings.update", Object.keys(b.settings ?? {}).join(",")); return; }
    if (b.op === "reset") { const { seedWorkspace } = await import("@/lib/schema"); Object.assign(w, seedWorkspace(w.id)); return; }
    if (!COLLECTIONS.includes(b.coll)) throw new Error("bad collection");
    const arr = (w as unknown as Record<CollName, { id: string }[]>)[b.coll as CollName];
    const items = Array.isArray(b.items) ? b.items : b.item ? [b.item] : [];
    if (b.op === "delete") { const ids = new Set(b.ids ?? [b.id]); (w as any)[b.coll] = arr.filter((x) => !ids.has(x.id)); audit(w, actor, `${b.coll}.delete`, [...ids].join(",")); return; }
    for (const it of items) { if (b.coll === "vendors") { delete it.tokens; delete it.hasTokens; } if (b.coll === "leads" && !it.score) it.score = scoreLead(it); const i = arr.findIndex((x) => x.id === it.id); if (i >= 0) arr[i] = { ...arr[i], ...it }; else arr.unshift(it); }
    audit(w, actor, `${b.coll}.upsert`, items.map((x: { id: string; name?: string }) => x.name ?? x.id).join(", ").slice(0, 200));
  });
  return Response.json({ ok: true, workspace: strip(w) });
}
