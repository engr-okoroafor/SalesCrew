import { loadWorkspace } from "./store";
import { publish } from "./meta";
import type { Post } from "./schema";
export async function runPost(ws: string, p: Post) {
  const w = await loadWorkspace(ws); const v = w.vendors.find((x) => x.id === p.vendorId); const res: Record<string, unknown> = {};
  const to = w.leads.filter((l) => l.vendorId === p.vendorId && l.phone).map((l) => l.phone.replace(/\D/g, "")).slice(0, 50);
  for (const t of p.targets) res[t] = await publish(t, p.text, p.image, { pageId: v?.channels.messenger?.pageId, pageToken: v?.tokens?.messenger, igUserId: v?.channels.instagram?.igUserId, waToken: v?.tokens?.whatsapp, waPhoneId: v?.channels.whatsapp?.phoneNumberId, to });
  return res;
}
