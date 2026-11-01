// Engagements: people who liked, commented, messaged or called. Reply publicly to comments, send a private DM (Meta private replies), or auto-engage all new ones with AI.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { replyComment, privateReply, vendorCreds, type Channel as MetaCh } from "@/lib/meta";
import { complete, prefer } from "@/lib/ai";
import { vendorScope } from "@/lib/agent";
import { audit } from "@/lib/pipeline";
import type { Engagement, Workspace } from "@/lib/schema";
export const maxDuration = 60;
async function draftFor(w: Workspace, e: Engagement, lang = "en") {
  const v = w.vendors.find((x) => x.id === e.vendorId) ?? w.vendors[0];
  const r = await complete([{ role: "system", content: `${vendorScope(w, v)}\nWrite ONE short, warm ${e.kind === "comment" ? "public reply to this social comment (max 30 words, invite them to DM)" : "private DM to someone who engaged with our post (max 45 words, helpful, one clear next step)"}. Language code ${lang} (en, pcm=Pidgin, ig=Igbo, yo=Yoruba, ha=Hausa). No hashtags.` },
    { role: "user", content: `${e.who} ${e.kind === "like" ? "liked our post" : e.kind === "share" ? "shared our post" : e.kind === "mention" ? "mentioned us" : `wrote: "${e.text ?? ""}"`}` }],
    { max: 160, prefer: prefer(w.settings.ai.primary), offline: e.kind === "comment" ? `Thanks ${e.who.split(" ")[0]}! 🙌 We've sent you a DM with details.` : `Hi ${e.who.split(" ")[0]}, thanks for engaging with ${v.name}! Want me to send prices or book you in? Just reply here.` });
  return r.text.trim();
}
async function act(w: Workspace, e: Engagement, mode: "reply" | "dm" | "both", text?: string, lang?: string) {
  const v = w.vendors.find((x) => x.id === e.vendorId); const ch = (e.channel === "instagram" ? "instagram" : "messenger") as MetaCh; const creds = vendorCreds(v, ch); const out: Record<string, unknown> = {};
  const msg = text || (await draftFor(w, e, lang));
  if ((mode === "reply" || mode === "both") && e.commentId) { out.reply = await replyComment(ch, e.commentId, msg, creds.token); e.reply = msg; e.status = "replied"; }
  if (mode === "dm" || mode === "both") { const dm = mode === "both" ? (text ? msg : await draftFor(w, { ...e, kind: "like" }, lang)) : msg;
    out.dm = e.commentId ? await privateReply(ch, e.commentId, dm, creds) : { ok: false, dryRun: true, note: "likes/shares have no comment id — Meta only allows DMs to people who commented or messaged" }; e.reply = e.reply ?? dm; e.status = "dm-sent"; }
  return out;
}
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
