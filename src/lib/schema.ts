// Workspace document schema (multi-tenant → multi-vendor). Shared by client & server.
export type Channel = "whatsapp" | "messenger" | "instagram" | "email" | "sms" | "voice" | "web";
export type Stage = "new" | "contacted" | "qualified" | "proposal" | "won" | "paid" | "nurture" | "lost";
export type Vendor = { id: string; name: string; industry: string; city: string; currency: "NGN" | "USD"; color: string; logo?: string; active: boolean;
  channels: { whatsapp?: { phoneNumberId?: string; wabaId?: string; display?: string; status: "connected" | "pending" | "off" };
    messenger?: { pageId?: string; pageName?: string; status: "connected" | "pending" | "off" }; instagram?: { igUserId?: string; handle?: string; status: "connected" | "pending" | "off" } };
  autoReply: boolean; hours: string; persona: string; knowledge?: string; docs?: { name: string; url?: string; chars: number; at: string }[]; bank?: BankAccount[]; tokens?: Record<string, string> /* server-only, stripped from API */ };
export type BankAccount = { bank: string; accountName: string; accountNumber: string; currency: "NGN" | "USD"; note?: string };
export type Product = { id: string; vendorId: string; kind: "good" | "service"; name: string; category: string; price: number; currency: "NGN" | "USD"; desc: string; media: { url: string; type: "image" | "video" }[]; stock?: number; leadTime?: string; tags: string[]; views?: number; buyers?: number; inquiries?: number };
export type Lead = { id: string; vendorId: string; name: string; company: string; email: string; phone: string; source: string; channel: Channel; segment: string; customerType: "B2B" | "B2C" | "Reseller" | "Government" | "NGO";
  interests: string[]; productIds: string[]; campaignId?: string; score: number; stage: Stage; value: number; note: string; lang: string; createdAt: string; lastTouch?: string; tags: string[] };
export type Message = { id: string; from: "customer" | "agent" | "ai" | "system"; text: string; at: string; media?: { url: string; type: "image" | "video" }[]; status?: "sent" | "delivered" | "read" | "dry-run" | "failed" };
export type Conversation = { id: string; vendorId: string; leadId?: string; channel: Channel; contact: string; contactId: string; avatar?: string; profile?: { name?: string; phone?: string; handle?: string; username?: string; photo?: string }; messages: Message[]; unread: number; aiOn: boolean; updatedAt: string; window24h?: string };
export type Campaign = { id: string; vendorId: string; name: string; objective: "leads" | "sales" | "awareness" | "retention"; channels: Channel[]; productIds: string[]; segment: string; budget: number; status: "draft" | "active" | "paused" | "done"; leads: number; revenue: number; startsAt: string };
export type Post = { id: string; vendorId: string; campaignId?: string; text: string; image?: string; targets: ("fb_feed" | "fb_group" | "wa_community" | "wa_status" | "wa_broadcast" | "messenger" | "ig_feed" | "ig_dm" | "email")[]; scheduledAt: string; status: "scheduled" | "posted" | "draft" | "failed"; result?: string };
export type Outreach = { id: string; vendorId: string; leadId: string; channel: Channel; subject?: string; body: string; status: "draft" | "sent" | "replied" | "dry-run"; upsell?: string[]; at: string };
export type Call = { id: string; vendorId: string; leadId?: string; direction: "outbound" | "inbound"; via: "whatsapp" | "agent-bot" | "pstn"; lang: string; status: "queued" | "live" | "done" | "no-answer"; transcript: { speaker: string; lang: string; text: string; tr?: string }[]; outcome?: string; bookingId?: string; at: string; durationSec?: number };
export type Booking = { id: string; vendorId: string; leadId?: string; title: string; start: string; durationMin: number; channel: Channel; status: "confirmed" | "tentative" | "cancelled" | "done"; source: "call-lab" | "inbox" | "manual" | "site"; value?: number };
export type CapiEvent = { id: string; vendorId: string; name: string; leadId?: string; value?: number; currency?: string; at: string; status: "sent" | "dry-run" | "failed"; response?: string; actionSource: string };
export type Payment = { id: string; vendorId: string; leadId?: string; provider: "paystack" | "stripe" | "transfer"; amount: number; currency: "NGN" | "USD"; status: "initiated" | "paid" | "failed" | "refunded" | "pending-confirmation"; ref: string; productId?: string; method?: "card" | "transfer" | "cash"; url?: string; at: string };
export type SiteFile = { path: string; content: string };
export type Site = { id: string; vendorId: string; name: string; kind: "web" | "mobile"; theme: string; prompt: string; history: { role: "user" | "ai" | "step"; text: string; at: string; attachments?: string[] }[]; versions?: { v: number; at: string; prompt: string; summary: string; files: SiteFile[] }[]; facts?: string[]; files: SiteFile[]; features: string[]; deployed?: { target: string; url?: string; at: string; status: string }[]; updatedAt: string };
export type Memory = { id: string; vendorId: string; leadId?: string; scope: "short" | "long"; kind: "fact" | "preference" | "objection" | "promise" | "outcome" | "insight"; text: string; at: string; ttlHours?: number };
export type Rule = { id: string; name: string; when: { channel?: Channel; campaignId?: string; productTag?: string; keyword?: string }; assignVendorId: string; assignAgent?: string; priority: number; active: boolean };
export type Engagement = { id: string; vendorId: string; leadId?: string; channel: Channel; kind: "like" | "comment" | "message" | "call" | "share" | "mention"; postId?: string; commentId?: string; who: string; whoId?: string; text?: string; at: string; status: "new" | "replied" | "dm-sent" | "ignored"; reply?: string };
export type Task = { id: string; name: string; kind: "follow-up-stale" | "auto-engage" | "publish-due" | "digest" | "reactivate-paid" | "payment-reminder" | "custom"; schedule: "hourly" | "daily" | "weekly"; enabled: boolean; approval: boolean; prompt?: string; lastRun?: string; nextRun?: string; lastResult?: string };
export type Approval = { id: string; taskId?: string; title: string; detail: string; action: { type: string; payload: Record<string, unknown> }; status: "pending" | "approved" | "rejected" | "done"; at: string };
export type Audit = { id: string; at: string; actor: string; action: string; detail: string };
export type Settings = { language: string; autoTranslate: boolean; timezone: string; ai: { primary: "meta" | "nvidia"; temperature: number; autoReply: boolean; humanHandoffKeyword: string; replyMaxWords: number };
  calls: { defaultLang: string; langs: string[]; autoBook: boolean; voiceVia: "whatsapp" | "agent-bot"; recordCalls: boolean; workingHours: { start: string; end: string; days: number[] }; slotMin: number };
  payments: { paystack: boolean; stripe: boolean; defaultCurrency: "NGN" | "USD"; transferDetails: string; bank?: BankAccount[] };
  capi: { pixelId: string; testEventCode: string; autoEvents: string[] }; notifications: { email: string; dailyDigest: boolean; hotLeadAlert: boolean };
  outreach: { quietHours: string; maxPerDay: number; signature: string }; site: { defaultTarget: "vercel" | "netlify" | "github" } };
export type Workspace = { id: string; name: string; plan: "free" | "pro" | "scale"; createdAt: string; updatedAt: string; vendors: Vendor[]; products: Product[]; leads: Lead[]; conversations: Conversation[]; campaigns: Campaign[]; posts: Post[];
  outreach: Outreach[]; calls: Call[]; bookings: Booking[]; capi: CapiEvent[]; payments: Payment[]; sites: Site[]; memory: Memory[]; rules: Rule[]; audit: Audit[]; settings: Settings; engagements?: Engagement[]; tasks?: Task[]; approvals?: Approval[]; team: { id: string; name: string; email: string; role: "owner" | "admin" | "agent"; vendorIds: string[] }[] };
export const COLLECTIONS = ["vendors", "products", "leads", "conversations", "campaigns", "posts", "outreach", "calls", "bookings", "capi", "payments", "sites", "memory", "rules", "audit", "team", "engagements", "tasks", "approvals"] as const;
export type CollName = (typeof COLLECTIONS)[number];
export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const now = () => new Date().toISOString();
const day = (d: number, h = 10) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0); return t.toISOString(); };
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

export const defaultTasks = (): Task[] => [
  { id: "t_stale", name: "Follow up stale leads (3+ days)", kind: "follow-up-stale", schedule: "daily", enabled: true, approval: true },
  { id: "t_engage", name: "Auto-reply to post comments & DM engagers", kind: "auto-engage", schedule: "hourly", enabled: true, approval: true },
  { id: "t_publish", name: "Publish due scheduled posts", kind: "publish-due", schedule: "hourly", enabled: true, approval: false },
  { id: "t_payrem", name: "Remind unpaid payment links (24h)", kind: "payment-reminder", schedule: "daily", enabled: true, approval: true },
  { id: "t_reactivate", name: "Upsell paid customers after 14 days", kind: "reactivate-paid", schedule: "weekly", enabled: false, approval: true },
  { id: "t_digest", name: "Daily admin digest", kind: "digest", schedule: "daily", enabled: true, approval: false },
];
export function seedWorkspace(id: string): Workspace {
  const v1 = "v_amaka", v2 = "v_solar", v3 = "v_kora";
  const settings: Settings = { language: "en-US", autoTranslate: true, timezone: "Africa/Lagos", ai: { primary: "meta", temperature: 0.4, autoReply: true, humanHandoffKeyword: "HUMAN", replyMaxWords: 70 },
    calls: { defaultLang: "en", langs: ["en", "pcm", "ig", "yo", "ha"], autoBook: true, voiceVia: "whatsapp", recordCalls: true, workingHours: { start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5, 6] }, slotMin: 30 },
    payments: { paystack: true, stripe: true, defaultCurrency: "NGN", transferDetails: "", bank: [{ bank: "Moniepoint MFB", accountName: "SalesCrew Collections", accountNumber: "0000000000", currency: "NGN", note: "Replace in Admin → Payments" }] }, capi: { pixelId: "", testEventCode: "", autoEvents: ["Lead", "Schedule", "Purchase", "Contact"] },
    notifications: { email: "", dailyDigest: true, hotLeadAlert: true }, outreach: { quietHours: "21:00-08:00", maxPerDay: 200, signature: "— Sent with SalesCrew" }, site: { defaultTarget: "vercel" } };
  const vendors: Vendor[] = [
    { id: v1, name: "Amaka's Oven & Events", industry: "Food & events", city: "Port Harcourt", currency: "NGN", color: "#39ff88", active: true, autoReply: true, hours: "Mon–Sat 8:00–19:00", persona: "Warm, Nigerian-English friendly baker and caterer", channels: { whatsapp: { status: "connected", display: "+234 803 000 0000" }, messenger: { status: "connected", pageName: "MoneyMinds", pageId: "265491983319446" }, instagram: { status: "pending" } } },
    { id: v2, name: "SunGrid Solar Supplies", industry: "Energy goods & installation", city: "Lagos", currency: "NGN", color: "#ffd23f", active: true, autoReply: true, hours: "Mon–Fri 9:00–18:00", persona: "Technical, reassuring solar advisor", channels: { whatsapp: { status: "pending" }, messenger: { status: "off" }, instagram: { status: "off" } } },
    { id: v3, name: "Kora Consulting", industry: "B2B services (US)", city: "Austin, TX", currency: "USD", color: "#7c5cff", active: true, autoReply: false, hours: "Mon–Fri 9–5 CT", persona: "Crisp, consultative US B2B tone", channels: { messenger: { status: "off" }, instagram: { status: "off" }, whatsapp: { status: "off" } } },
  ];
  const products: Product[] = [
    { id: "p1", vendorId: v1, kind: "good", name: "Celebration cake (6-inch)", category: "Cakes", price: 25000, currency: "NGN", desc: "Chocolate, red velvet or vanilla. 48h lead time.", media: [{ url: U("1535141192574-5d4897c12636"), type: "image" }], leadTime: "48h", tags: ["birthday", "cake"] },
    { id: "p2", vendorId: v1, kind: "good", name: "Wedding cake (3-tier)", category: "Cakes", price: 180000, currency: "NGN", desc: "Tasting included. 7 days notice.", media: [{ url: U("1578985545062-69928b1d9587"), type: "image" }], leadTime: "7 days", tags: ["wedding", "cake"] },
    { id: "p3", vendorId: v1, kind: "service", name: "Corporate event catering (per head)", category: "Catering", price: 6500, currency: "NGN", desc: "Buffet, small chops, jollof. 20–500 guests.", media: [{ url: "/photos/catering.jpg", type: "image" }], leadTime: "5 days", tags: ["corporate", "catering", "event"] },
    { id: "p4", vendorId: v1, kind: "service", name: "Event styling & setup", category: "Events", price: 250000, currency: "NGN", desc: "Owambe, weddings and corporate tables styled end-to-end.", media: [{ url: "/photos/events.jpg", type: "image" }], tags: ["wedding", "event"] },
    { id: "p5", vendorId: v2, kind: "good", name: "5kVA hybrid inverter kit", category: "Inverters", price: 1450000, currency: "NGN", desc: "Inverter + 4 lithium batteries + 6 panels.", media: [{ url: U("1509391366360-2e959784a276"), type: "image" }], stock: 14, tags: ["solar", "home"] },
    { id: "p6", vendorId: v2, kind: "service", name: "Installation & maintenance plan", category: "Services", price: 120000, currency: "NGN", desc: "Install + 12 months quarterly maintenance.", media: [{ url: U("1508514177221-188b1cf16e9d"), type: "image" }], tags: ["solar", "service"] },
    { id: "p7", vendorId: v3, kind: "service", name: "Sales ops audit", category: "Consulting", price: 2500, currency: "USD", desc: "2-week CRM + funnel audit with roadmap.", media: [{ url: U("1600880292203-757bb62b4baf"), type: "image" }], tags: ["b2b", "audit"] },
    { id: "p8", vendorId: v3, kind: "service", name: "Fractional RevOps (monthly)", category: "Retainer", price: 4000, currency: "USD", desc: "Ongoing pipeline management.", media: [], tags: ["b2b", "retainer"] },
  ];
  const L = (o: Partial<Lead> & Pick<Lead, "id" | "vendorId" | "name">): Lead => ({ company: "", email: "", phone: "", source: "FB Lead Ad", channel: "whatsapp", segment: "General", customerType: "B2C", interests: [], productIds: [], score: 50, stage: "new", value: 0, note: "", lang: "en", createdAt: now(), tags: [], ...o });
  const leads: Lead[] = [
    L({ id: "l1", vendorId: v1, name: "Tonye Briggs", company: "Briggs Events Ltd", email: "tonye@briggsevents.ng", phone: "+2348031112222", source: "FB Lead Ad", channel: "messenger", segment: "Event planners", customerType: "Reseller", interests: ["wedding cakes"], productIds: ["p2"], score: 88, stage: "qualified", value: 540000, note: "Needs cakes for 3 weddings in December", lang: "pcm", campaignId: "c1" }),
    L({ id: "l2", vendorId: v1, name: "Ngozi Eze", company: "Woji Hotel & Suites", email: "ngozi.eze@wojihotel.ng", phone: "+2348052223333", source: "IG comment", channel: "instagram", segment: "Hospitality", customerType: "B2B", interests: ["small chops"], productIds: ["p3"], score: 74, stage: "contacted", value: 325000, note: "Commented on small chops post", lang: "ig" }),
    L({ id: "l3", vendorId: v1, name: "Dr. Ibim Jack", company: "RiverCare Clinic", email: "admin@rivercare.ng", phone: "+2348064445555", source: "Google search", channel: "email", segment: "Corporate HR", customerType: "B2B", interests: ["staff day catering"], productIds: ["p3"], score: 62, stage: "new", value: 390000, note: "Staff appreciation day every Q4", lang: "en" }),
    L({ id: "l4", vendorId: v1, name: "Funke Adeyemi", company: "", email: "funke.a@gmail.com", phone: "+2348107778888", source: "WhatsApp click-to-chat", channel: "whatsapp", segment: "Birthday buyers", customerType: "B2C", interests: ["birthday cake"], productIds: ["p1"], score: 80, stage: "paid", value: 25000, note: "Paid via Paystack; daughter's 5th birthday", lang: "yo", tags: ["repeat"] }),
    L({ id: "l5", vendorId: v2, name: "Musa Bello", company: "Bello Pharmacy", email: "musa@bellopharm.ng", phone: "+2348091234567", source: "FB Lead Ad", channel: "whatsapp", segment: "SME shops", customerType: "B2B", interests: ["inverter"], productIds: ["p5"], score: 70, stage: "proposal", value: 1570000, note: "Generator costs too high", lang: "ha", campaignId: "c2" }),
    L({ id: "l6", vendorId: v2, name: "Chioma Nwosu", company: "", email: "chioma.n@yahoo.com", phone: "+2348023456789", source: "IG DM", channel: "instagram", segment: "Homeowners", customerType: "B2C", interests: ["home solar"], productIds: ["p5"], score: 55, stage: "new", value: 1450000, note: "Asked about installment", lang: "ig" }),
    L({ id: "l7", vendorId: v3, name: "Jordan Hale", company: "Hale Logistics", email: "jordan@halelogistics.com", phone: "+15125550123", source: "LinkedIn", channel: "email", segment: "US SMB", customerType: "B2B", interests: ["CRM cleanup"], productIds: ["p7"], score: 66, stage: "contacted", value: 2500, note: "HubSpot mess, 40 reps", lang: "en" }),
  ];
  const conv = (id: string, vendorId: string, leadId: string, channel: Channel, contact: string, msgs: [Message["from"], string][]): Conversation => ({ id, vendorId, leadId, channel, contact, contactId: leadId, unread: 1, aiOn: true, updatedAt: now(),
    messages: msgs.map(([from, text], i) => ({ id: `${id}m${i}`, from, text, at: new Date(Date.now() - (msgs.length - i) * 60000).toISOString(), status: from === "customer" ? undefined : "read" })) });
  const conversations: Conversation[] = [
    { ...conv("cv1", v1, "l4", "whatsapp", "Funke Adeyemi", [["customer", "Good evening! Can I get a 6-inch birthday cake ready for Saturday? Chocolate please 🎂"], ["ai", "Good evening Funke! 🎂 Yes — a 6-inch chocolate celebration cake is ₦25,000 and Saturday works (48h lead time). Shall I book it and send a Paystack link? Reply HUMAN anytime to talk to Amaka."]]), profile: { name: "Funke Adeyemi", phone: "+234 810 777 8888", photo: "https://i.pravatar.cc/120?img=47" } },
    { ...conv("cv2", v1, "l1", "messenger", "Tonye Briggs", [["customer", "Hi, how far? I get 3 weddings for December, una fit handle the cakes?"]]), profile: { name: "Tonye Briggs", username: "tonye.briggs.events" } },
    { ...conv("cv3", v1, "l2", "instagram", "Ngozi Eze", [["customer", "Saw your small chops post 😍 do you deliver 50 pcs to Woji on Friday?"]]), profile: { name: "Ngozi Eze", handle: "ngozi.eze" } },
    { ...conv("cv4", v2, "l5", "whatsapp", "Musa Bello", [["customer", "Salam. Ina son inverter 5kVA don shagona. Nawa ne?"]]), profile: { name: "Musa Bello", phone: "+234 809 123 4567" } },
  ];
  return { id, name: id === "demo" ? "Demo workspace" : "My workspace", plan: "free", createdAt: now(), updatedAt: now(), vendors, products, leads, conversations,
    campaigns: [
      { id: "c1", vendorId: v1, name: "December weddings", objective: "leads", channels: ["messenger", "instagram", "whatsapp"], productIds: ["p2", "p4"], segment: "Event planners", budget: 150000, status: "active", leads: 23, revenue: 720000, startsAt: day(-10) },
      { id: "c2", vendorId: v2, name: "Beat the generator", objective: "sales", channels: ["whatsapp", "messenger"], productIds: ["p5", "p6"], segment: "SME shops", budget: 300000, status: "active", leads: 41, revenue: 2900000, startsAt: day(-20) },
    ],
    posts: [{ id: "po1", vendorId: v1, campaignId: "c1", text: "December weddings are filling up 💍 Book a free cake tasting this week!", image: U("1578985545062-69928b1d9587"), targets: ["fb_feed", "ig_feed", "wa_status"], scheduledAt: day(1, 18), status: "scheduled" }],
    outreach: [], calls: [{ id: "ca1", vendorId: v1, leadId: "l1", direction: "inbound", via: "whatsapp", lang: "pcm", status: "done", at: day(-1, 15), durationSec: 212, outcome: "Booked tasting", bookingId: "b1",
      transcript: [{ speaker: "Tonye", lang: "pcm", text: "Abeg, una fit do tasting next week?", tr: "Please, can you do a tasting next week?" }, { speaker: "Agent", lang: "pcm", text: "Yes o! Thursday 10am dey free. Make I book am?", tr: "Yes! Thursday 10am is free. Shall I book it?" }] }],
    bookings: [
      { id: "b1", vendorId: v1, leadId: "l1", title: "Wedding cake tasting — Briggs Events", start: day(2, 10), durationMin: 45, channel: "voice", status: "confirmed", source: "call-lab", value: 540000 },
      { id: "b2", vendorId: v1, leadId: "l3", title: "Catering consult — RiverCare", start: day(4, 14), durationMin: 30, channel: "email", status: "tentative", source: "manual", value: 390000 },
      { id: "b3", vendorId: v2, leadId: "l5", title: "Site survey — Bello Pharmacy", start: day(3, 11), durationMin: 60, channel: "whatsapp", status: "confirmed", source: "inbox", value: 1570000 },
    ],
    capi: [], payments: [{ id: "pay1", vendorId: v1, leadId: "l4", provider: "paystack", amount: 25000, currency: "NGN", status: "paid", ref: "SC-DEMO-1", at: day(-2) }], sites: [],
    memory: [
      { id: "m1", vendorId: v1, leadId: "l4", scope: "long", kind: "preference", text: "Funke prefers chocolate; daughter's birthday is in November — remind next year + upsell small chops.", at: now() },
      { id: "m2", vendorId: v1, leadId: "l1", scope: "long", kind: "fact", text: "Tonye plans ~3 weddings/quarter; speaks Pidgin; price-sensitive on delivery.", at: now() },
      { id: "m3", vendorId: v2, leadId: "l5", scope: "short", kind: "objection", text: "Musa worried about upfront cost — offer installment.", at: now(), ttlHours: 72 },
    ],
    rules: [
      { id: "r1", name: "Wedding keywords → Amaka", when: { keyword: "wedding" }, assignVendorId: v1, priority: 1, active: true },
      { id: "r2", name: "Solar/inverter → SunGrid", when: { keyword: "inverter" }, assignVendorId: v2, priority: 1, active: true },
      { id: "r3", name: "Campaign c2 leads → SunGrid", when: { campaignId: "c2" }, assignVendorId: v2, priority: 2, active: true },
    ],
    engagements: [
      { id: "e1", vendorId: v1, leadId: "l2", channel: "instagram", kind: "comment", postId: "po1", commentId: "demo_c1", who: "@ngozi.eze", text: "How much for 50 small chops? 😍", at: day(0, 9), status: "new" },
      { id: "e2", vendorId: v1, channel: "messenger", kind: "like", postId: "po1", who: "Ada Okafor", at: day(0, 8), status: "new" },
      { id: "e3", vendorId: v2, leadId: "l6", channel: "instagram", kind: "comment", postId: "po1", commentId: "demo_c2", who: "@chioma.builds", text: "Do you do installment for the 5kVA?", at: day(-1, 16), status: "new" },
    ],
    tasks: defaultTasks(), approvals: [],
    audit: [{ id: "a1", at: now(), actor: "system", action: "workspace.seeded", detail: "Demo data created" }], settings,
    team: [{ id: "t1", name: "Chukwudifu Okoroafor", email: "owner@salescrew.app", role: "owner", vendorIds: [v1, v2, v3] }, { id: "t2", name: "Hilda", email: "hilda@salescrew.app", role: "admin", vendorIds: [v1, v2, v3] }] };
}
