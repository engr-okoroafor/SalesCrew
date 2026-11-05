// Engagement analytics → urgency insights, winning-tactic replication and timezone-aware campaign proposals (human-approved).
import { uid, type Workspace, type Vendor, type Post } from "./schema";
import { audit } from "./pipeline";
export type Insight = { level: "urgent" | "high" | "info"; title: string; detail: string; href?: string; vendorId?: string };
const tzOf = (v?: Vendor) => v?.timezone ?? (v?.currency === "USD" ? "America/Chicago" : "Africa/Lagos");
export const hourIn = (iso: string, tz: string) => { try { return +new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso)) % 24; } catch { return new Date(iso).getUTCHours(); } };
/** 24-bucket histogram of customer activity (messages, comments, likes) in the vendor's local time. */
export function activityHours(w: Workspace, vendorId?: string) {
  const h = Array(24).fill(0) as number[]; const v = w.vendors.find((x) => x.id === vendorId); const tz = tzOf(v);
  for (const c of w.conversations) if (!vendorId || c.vendorId === vendorId) for (const m of c.messages) if (m.from === "customer") h[hourIn(m.at, tzOf(w.vendors.find((x) => x.id === c.vendorId)) ?? tz)]++;
  for (const e of w.engagements ?? []) if (!vendorId || e.vendorId === vendorId) h[hourIn(e.at, tz)]++;
  if (h.every((x) => !x)) [8, 9, 12, 13, 18, 19, 20, 21].forEach((x, i) => (h[x] = 3 + (i % 3))); // sensible WAT defaults before data exists
  return h;
}
/** Next UTC instant that falls in the audience's busiest local hour (never sooner than 30 min). */
export function nextBestTime(w: Workspace, vendorId: string, now = Date.now()) {
  const h = activityHours(w, vendorId); const best = h.indexOf(Math.max(...h)); const tz = tzOf(w.vendors.find((v) => v.id === vendorId));
  for (let k = 1; k <= 48; k++) { const t = now + k * 3600e3; if (hourIn(new Date(t).toISOString(), tz) === best && t - now > 30 * 60e3) { const d = new Date(t); d.setUTCMinutes(0, 0, 0); return { at: d.toISOString(), hour: best, tz }; } }
  return { at: new Date(now + 3600e3).toISOString(), hour: best, tz };
}
export function productStats(w: Workspace, vendorId?: string) {
  return w.products.filter((p) => !vendorId || p.vendorId === vendorId).map((p) => { const leads = w.leads.filter((l) => l.productIds.includes(p.id)); const buyers = leads.filter((l) => ["won", "paid", "nurture"].includes(l.stage)).length;
    const interested = leads.length + (p.inquiries ?? 0); return { p, interested, buyers, conv: interested ? buyers / interested : 0, revenue: leads.filter((l) => ["won", "paid", "nurture"].includes(l.stage)).reduce((a, l) => a + l.value, 0) }; });
}
export function insights(w: Workspace, vendorId?: string): Insight[] {
  const out: Insight[] = []; const now = Date.now(); const inV = (x: { vendorId: string }) => !vendorId || x.vendorId === vendorId;
  const waiting = w.conversations.filter(inV).filter((c) => c.unread > 0 && c.messages.at(-1)?.from === "customer");
  const old = waiting.filter((c) => now - +new Date(c.messages.at(-1)!.at) > 15 * 60e3);
  if (old.length) out.push({ level: "urgent", title: `${old.length} customer${old.length > 1 ? "s" : ""} waiting 15+ min`, detail: old.slice(0, 3).map((c) => c.contact).join(", ") + " — replies after 1h convert ~7x worse. Turn on AI auto-reply or answer now.", href: "/app/inbox" });
  const wa = w.conversations.filter(inV).filter((c) => c.channel === "whatsapp" && c.window24h && +new Date(c.window24h) - now < 3 * 3600e3 && +new Date(c.window24h) > now);
  if (wa.length) out.push({ level: "urgent", title: `${wa.length} WhatsApp 24h window${wa.length > 1 ? "s" : ""} closing`, detail: "After the window closes only paid template messages are allowed. Send a follow-up now.", href: "/app/inbox" });
  const hot = w.leads.filter(inV).filter((l) => l.score >= 70 && !["won", "paid", "lost", "nurture"].includes(l.stage) && now - +new Date(l.lastTouch ?? l.createdAt) > 48 * 3600e3);
  if (hot.length) out.push({ level: "high", title: `${hot.length} hot lead${hot.length > 1 ? "s" : ""} untouched for 48h`, detail: hot.slice(0, 3).map((l) => `${l.name} (${l.score})`).join(", "), href: `/app/outreach?leads=${hot.map((l) => l.id).join(",")}` });
  const proposals = w.leads.filter(inV).filter((l) => l.stage === "proposal"); if (proposals.length) out.push({ level: "high", title: `${proposals.length} proposal${proposals.length > 1 ? "s" : ""} awaiting decision`, detail: `₦/$ ${proposals.reduce((a, l) => a + l.value, 0).toLocaleString()} in play — send a payment link to close.`, href: "/app/leads" });
  const ps = productStats(w, vendorId).filter((x) => x.interested > 0).sort((a, b) => b.conv - a.conv || b.revenue - a.revenue);
  if (ps.length > 1 && ps[0].conv > 0) { const win = ps[0], lag = ps.slice(1).sort((a, b) => b.interested - a.interested).find((x) => x.conv < win.conv);
    if (lag) out.push({ level: "info", title: `Replicate “${win.p.name}” tactics on “${lag.p.name}”`, detail: `${Math.round(win.conv * 100)}% vs ${Math.round(lag.conv * 100)}% conversion. Reuse its photo style, price anchoring and CTA, and retarget the ${lag.interested} interested lead(s).`, href: "/app/products", vendorId: lag.p.vendorId }); }
  for (const v of w.vendors.filter((v) => !vendorId || v.id === vendorId)) { const b = nextBestTime(w, v.id); out.push({ level: "info", title: `${v.name}: audience peaks ~${String(b.hour).padStart(2, "0")}:00 (${b.tz})`, detail: `Schedule posts and follow-ups for then; next slot ${new Date(b.at).toLocaleString("en-GB", { timeZone: b.tz, weekday: "short", hour: "2-digit", minute: "2-digit" })}.`, vendorId: v.id }); }
  const pend = (w.approvals ?? []).filter((a) => a.status === "pending").length; if (pend) out.unshift({ level: "high", title: `${pend} AI proposal${pend > 1 ? "s" : ""} waiting for your approval`, detail: "Review, edit or reject in Admin → Autopilot.", href: "/app/admin?tab=autopilot" });
  return out;
}
/** Draft a timezone-aware campaign post for the vendor's best product and queue it as an Approval (owner approves/edits → scheduled → cron publishes). */
export function proposeCampaign(w: Workspace, vendorId: string, actor = "ai") {
  const v = w.vendors.find((x) => x.id === vendorId); if (!v) return null; const best = productStats(w, vendorId).sort((a, b) => b.conv - a.conv || b.interested - a.interested)[0]?.p ?? w.products.find((p) => p.vendorId === vendorId);
  const t = nextBestTime(w, vendorId); const text = best ? `✨ ${best.name} — ${best.currency === "USD" ? "$" : "₦"}${best.price.toLocaleString()} at ${v.name}. ${best.desc.split(".")[0]}. Message us on WhatsApp${v.channels.whatsapp?.display ? ` ${v.channels.whatsapp.display}` : ""} to order today! #${v.name.replace(/\W/g, "")}` : `${v.name} is taking orders this week — DM us to book!`;
  const post: Post = { id: uid("post"), vendorId, text, image: best?.media[0]?.url, targets: ["fb_feed", "ig_feed"], scheduledAt: t.at, status: "draft" }; w.posts.unshift(post);
  const ap = { id: uid("ap"), title: `Campaign for ${v.name}: post “${best?.name ?? "promo"}” at ${String(t.hour).padStart(2, "0")}:00 ${t.tz}`, detail: text, action: { type: "schedule", payload: { ids: [post.id] } }, status: "pending" as const, at: new Date().toISOString() };
  (w.approvals ??= []).unshift(ap); audit(w, actor, "campaign.propose", ap.title); return ap;
}
