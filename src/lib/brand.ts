// Rise & Eat brand taken from the supplied logo and services board. No invented list prices:
// the menu board names the services and does not print naira amounts.
import type { Product, Vendor, Workspace } from "./schema";

export const RISE_VENDOR_ID = "v_amaka";
/** WhatsApp Cloud API number already configured in Vercel (WHATSAPP_*). Tester link. */
export const RISE_WA_API = "+234 907 408 7284";
/** Call / WhatsApp printed on the services board. */
export const RISE_WA_BOARD = "+234 706 335 6787";
export const RISE_EMAIL = "riseandeat@gmail.com";
/** m.me id for the existing MoneyMinds Page (being renamed to Rise & Eat). Not a new Page. */
export const RISE_MME = "61558190371192";
/** Page asset id Meta webhooks and Graph use for that same Page. */
export const RISE_PAGE_ASSET = "265491983319446";
export const RISE_IG = "chukwudifu.okoroafor";
export const RISE_LOGO = "/brand/rise-and-eat-logo.jpg";
export const RISE_FLYER = "/brand/rise-and-eat-flyer.jpg";
export const RISE_TAGLINE = "Nourishing lives, celebrating every moment";
export const RISE_MOTTO = "Eat well, live well, rise everyday";

export type WaNumber = { phoneNumberId?: string; wabaId?: string; display: string; status: "connected" | "pending" | "off"; label?: string };

const C = "/brand/catalog";
type Item = { id: string; kind: "good" | "service"; name: string; category: string; desc: string; img: string; tags: string[]; leadTime?: string; tip: string };
/** Flyer order, top to bottom, left to right. price is omitted — the board has none. */
export const RISE_CATALOG: Item[] = [
  { id: "p1", kind: "good", name: "Cakes for all events", category: "Cakes", desc: "Celebration, birthday and wedding cakes from the Rise & Eat board.", img: `${C}/cakes.jpg`, tags: ["cake", "birthday", "wedding"], leadTime: "48h", tip: "Ask on WhatsApp — price is quoted, not printed on the board" },
  { id: "p3", kind: "service", name: "Catering services", category: "Catering", desc: "Event catering from the Rise & Eat services board.", img: `${C}/catering.jpg`, tags: ["catering", "event"], leadTime: "5 days", tip: "Quoted per event after a Nigerian market benchmark" },
  { id: "re-chops", kind: "good", name: "Small chops", category: "Small chops", desc: "Small chops from the Rise & Eat services board.", img: `${C}/chops.jpg`, tags: ["small chops", "chops", "puff"], tip: "Tray size changes the quote" },
  { id: "re-bread", kind: "good", name: "Homemade bread", category: "Bread", desc: "Homemade bread from the Rise & Eat services board.", img: `${C}/bread.jpg`, tags: ["bread", "loaf"], tip: "Loaf price is quoted" },
  { id: "re-pastry", kind: "good", name: "Pastries, snacks & popcorn", category: "Pastries", desc: "Pastries, snacks and popcorn from the Rise & Eat services board.", img: `${C}/pastries.jpg`, tags: ["pastry", "snack", "popcorn"], tip: "Priced per piece or tub on request" },
  { id: "re-yogurt", kind: "good", name: "Homemade yogurts & parfait", category: "Yogurt", desc: "Homemade yogurts and parfait from the Rise & Eat services board.", img: `${C}/yogurt.jpg`, tags: ["yogurt", "parfait"], tip: "Cup price is quoted" },
  { id: "re-juice", kind: "good", name: "Fresh fruit juice & tiger-nut juice", category: "Juices", desc: "Fresh fruit juice and tiger-nut juice from the Rise & Eat services board.", img: `${C}/juice.jpg`, tags: ["juice", "tiger-nut", "zobo"], tip: "Bottle price is quoted" },
  { id: "re-nuts", kind: "good", name: "Dried nuts & fruits", category: "Nuts & fruits", desc: "Dried nuts and fruits from the Rise & Eat services board.", img: `${C}/nuts.jpg`, tags: ["nuts", "dried fruit"], tip: "Pack price is quoted" },
  { id: "re-soup", kind: "good", name: "Takeaway soups & stew", category: "Soups & stew", desc: "Takeaway soups and stew from the Rise & Eat services board.", img: `${C}/soups.jpg`, tags: ["soup", "stew"], tip: "Quoted per portion" },
  { id: "re-cereal", kind: "good", name: "Cereals & organic honey", category: "Cereals & honey", desc: "Cereals and organic honey from the Rise & Eat services board.", img: `${C}/cereal.jpg`, tags: ["cereal", "honey"], tip: "Jar and pack prices are quoted" },
  { id: "re-tray", kind: "good", name: "Food tray", category: "Food tray", desc: "Food trays from the Rise & Eat services board.", img: `${C}/tray.jpg`, tags: ["tray", "food tray"], tip: "Tray price is quoted" },
  { id: "re-gifts", kind: "good", name: "Gift items", category: "Gifts", desc: "Gift items from the Rise & Eat services board.", img: `${C}/gifts.jpg`, tags: ["gift", "hamper"], tip: "Hamper price is quoted" },
  { id: "p4", kind: "service", name: "Event planning", category: "Events", desc: "Event planning from the Rise & Eat services board.", img: `${C}/events.jpg`, tags: ["event", "wedding", "planning"], leadTime: "7 days", tip: "Planned and quoted per event" },
  { id: "re-train", kind: "service", name: "Training", category: "Training", desc: "Baking and catering training from the Rise & Eat services board.", img: `${C}/training.jpg`, tags: ["training", "class", "baking"], tip: "Class fee is quoted" },
  { id: "re-ingredients", kind: "good", name: "Sales of baking ingredients", category: "Baking ingredients", desc: "Baking ingredients from the Rise & Eat services board.", img: `${C}/ingredients.jpg`, tags: ["ingredients", "flour", "butter"], tip: "Ingredient prices are quoted" },
];

export const RISE_KNOWLEDGE = `Rise & Eat. ${RISE_TAGLINE}. ${RISE_MOTTO}. Good food, good mood, better life. Made with love, served with pride. Fresh, wholesome, natural. Premium quality, royal taste. Healthy food, happy people, memorable events.
Logo and full services board are the catalog. Services (no prices are printed on the board — never invent a Rise & Eat list price): ${RISE_CATALOG.map((p) => p.name).join("; ")}.
When a customer asks the price of something that has no printed price, benchmark similar Nigerian businesses (Port Harcourt and Lagos bakeries, caterers, juice bars and gift shops) and give one clear naira quote plus a short range. Label it as a market benchmark the Rise & Eat team can confirm. Scale it to the quantity they asked for.
Contacts: Call/WhatsApp on the board ${RISE_WA_BOARD} (07063356787). WhatsApp Business inbox ${RISE_WA_API}. Email ${RISE_EMAIL}.
Messenger: existing Page being renamed from MoneyMinds to Rise & Eat. m.me/${RISE_MME}. Page asset ${RISE_PAGE_ASSET}. Do not create a new Page.
Instagram: @${RISE_IG} (ig.me/m/${RISE_IG}). The profile may still show older Health & Wealth branding until the rename finishes.`;

export function riseProducts(vendorId: string): Product[] {
  return RISE_CATALOG.map((p) => ({ id: p.id, vendorId, kind: p.kind, name: p.name, category: p.category, price: 0, currency: "NGN" as const, desc: p.desc, media: [{ url: p.img, type: "image" as const }], leadTime: p.leadTime, tags: p.tags }));
}

export function waNumbers(v: { channels: Vendor["channels"] }): WaNumber[] {
  const w = v.channels.whatsapp;
  if (!w) return [];
  const list = (w.numbers ?? []).filter((n) => n.display || n.phoneNumberId);
  if (list.length) return list;
  if (w.display || w.phoneNumberId) return [{ display: w.display ?? "", phoneNumberId: w.phoneNumberId, wabaId: w.wabaId, status: w.status }];
  return [];
}

const digits = (s?: string) => (s ?? "").replace(/\D/g, "");
const waLink = (display: string) => { let d = digits(display); if (d.startsWith("0")) d = "234" + d.slice(1); return d ? `https://wa.me/${d}` : ""; };

export function channelLinks(v: Vendor): { channel: "whatsapp" | "messenger" | "instagram"; label: string; href: string }[] {
  const out: { channel: "whatsapp" | "messenger" | "instagram"; label: string; href: string }[] = [];
  const seen = new Set<string>();
  for (const n of waNumbers(v)) { const href = waLink(n.display); if (!href || seen.has(href)) continue; seen.add(href); out.push({ channel: "whatsapp", label: n.label ? `WhatsApp · ${n.label}` : `WhatsApp ${n.display}`, href }); }
  const mme = v.channels.messenger?.mmeId;
  if (mme) out.push({ channel: "messenger", label: v.channels.messenger?.pageName || "Messenger", href: `https://m.me/${mme}` });
  const ig = v.channels.instagram?.handle?.replace(/^@/, "");
  if (ig) out.push({ channel: "instagram", label: `@${ig}`, href: `https://ig.me/m/${ig}` });
  return out;
}

export function riseChannels(): Vendor["channels"] {
  return {
    whatsapp: { status: "connected", display: RISE_WA_API, numbers: [
      { display: RISE_WA_API, status: "connected", label: "Business inbox" },
      { display: RISE_WA_BOARD, status: "connected", label: "Menu board" },
    ] },
    messenger: { status: "connected", pageName: "Rise & Eat", pageId: RISE_PAGE_ASSET, mmeId: RISE_MME },
    instagram: { status: "connected", handle: RISE_IG },
  };
}

const OLD_NAMES = new Set(["Celebration cake (6-inch)", "Wedding cake (3-tier)", "Corporate event catering (per head)", "Event styling & setup"]);

/** Idempotent: rename the existing Page, attach both WhatsApp numbers, and fill any missing board items. */
export function applyRiseBrand(doc: Workspace): boolean {
  const v = doc.vendors.find((x) => x.id === RISE_VENDOR_ID || x.name === "Rise & Eat");
  if (!v) return false;
  const before = JSON.stringify({ c: v.channels, logo: v.logo, email: v.email, autoReply: v.autoReply, knowledge: v.knowledge, products: doc.products.filter((p) => p.vendorId === v.id).map((p) => [p.id, p.name, p.price, p.desc, p.media?.[0]?.url]) });
  v.name = "Rise & Eat";
  v.logo = RISE_LOGO;
  v.email = v.email || RISE_EMAIL;
  v.autoReply = v.channels.messenger?.pageName === "MoneyMinds" || /803\s*000\s*0000/.test(v.channels.whatsapp?.display ?? "") ? true : v.autoReply !== false;
  const ms = v.channels.messenger ?? { status: "connected" as const };
  const ownsPage = ms.pageName === "MoneyMinds" || ms.pageId === RISE_PAGE_ASSET || ms.mmeId === RISE_MME || !ms.pageId;
  if (ownsPage) v.channels.messenger = { ...ms, pageName: "Rise & Eat", pageId: RISE_PAGE_ASSET, mmeId: RISE_MME, status: "connected" };
  const ig = v.channels.instagram ?? { status: "pending" as const };
  if (!ig.handle) v.channels.instagram = { ...ig, handle: RISE_IG, status: "connected" };
  const wa = v.channels.whatsapp ?? { status: "connected" as const };
  const nums = waNumbers({ channels: { whatsapp: wa } });
  const ensure = (display: string, label: string) => { if (!nums.some((n) => digits(n.display).endsWith(digits(display).slice(-10)))) nums.push({ display, status: "connected", label }); };
  const placeholder = !digits(wa.display) || digits(wa.display).endsWith("2348030000000");
  if (placeholder) nums.splice(0, nums.length, { display: RISE_WA_API, status: "connected", label: "Business inbox", phoneNumberId: wa.phoneNumberId, wabaId: wa.wabaId });
  ensure(RISE_WA_API, "Business inbox");
  ensure(RISE_WA_BOARD, "Menu board");
  const primary = nums.find((n) => digits(n.display).endsWith("9074087284")) ?? nums[0];
  v.channels.whatsapp = { ...wa, status: "connected", display: primary?.display ?? RISE_WA_API, phoneNumberId: primary?.phoneNumberId ?? wa.phoneNumberId, wabaId: wa.wabaId, numbers: nums };
  if (!v.knowledge?.includes("riseandeat@gmail.com")) v.knowledge = [RISE_KNOWLEDGE, v.knowledge].filter(Boolean).join("\n\n");
  const fresh = riseProducts(v.id);
  for (const p of fresh) {
    const cur = doc.products.find((x) => x.id === p.id && x.vendorId === v.id);
    if (!cur) doc.products.push(p);
    else if (OLD_NAMES.has(cur.name) || cur.price > 0 && OLD_NAMES.has(cur.name)) Object.assign(cur, { ...p, views: cur.views, buyers: cur.buyers, inquiries: cur.inquiries });
  }
  doc.products = doc.products.filter((p) => !(p.vendorId === v.id && p.id === "p2" && OLD_NAMES.has(p.name)));
  for (const c of doc.campaigns) if (c.vendorId === v.id) c.productIds = [...new Set(c.productIds.map((id) => id === "p2" ? "p1" : id))];
  for (const l of doc.leads) if (l.vendorId === v.id) l.productIds = [...new Set(l.productIds.map((id) => id === "p2" ? "p1" : id))];
  const after = JSON.stringify({ c: v.channels, logo: v.logo, email: v.email, autoReply: v.autoReply, knowledge: v.knowledge, products: doc.products.filter((p) => p.vendorId === v.id).map((p) => [p.id, p.name, p.price, p.desc, p.media?.[0]?.url]) });
  return before !== after;
}
