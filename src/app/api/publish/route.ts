// Publish/schedule posts to FB feed, IG feed, WA broadcast/status, Messenger; groups/communities via share-link.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { runPost } from "@/lib/publisher";
import { uid, type Post } from "@/lib/schema";
import { audit } from "@/lib/pipeline";
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const now = Date.now();
  const p: Post = { id: b.id ?? uid("post"), vendorId: b.vendorId, campaignId: b.campaignId, text: b.text, image: b.image, targets: b.targets ?? ["fb_feed"], scheduledAt: b.scheduledAt ?? new Date().toISOString(), status: "scheduled" };
  let result: Record<string, unknown> | undefined;
  if (+new Date(p.scheduledAt) <= now + 60000) { result = await runPost(ws, p); const ok = Object.values(result).some((r) => (r as { ok?: boolean }).ok); p.status = ok ? "posted" : "draft"; p.result = JSON.stringify(result).slice(0, 1500); }
  const w = await mutate(ws, (w) => { const i = w.posts.findIndex((x) => x.id === p.id); if (i >= 0) w.posts[i] = p; else w.posts.unshift(p); audit(w, "publisher", `post.${p.status}`, p.targets.join(",")); });
  return Response.json({ post: p, result, posts: w.posts });
}
