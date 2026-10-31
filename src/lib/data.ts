// Seed demo data: Amaka's Oven & Events — a bakery + event catering business in Port Harcourt.
export const BUSINESS = {
  name: "Amaka's Oven & Events", city: "Port Harcourt, Rivers State", phone: "+234 803 000 0000",
  services: [
    { name: "Celebration cake (6-inch)", price: 25000, lead: "48h" }, { name: "Wedding cake (3-tier)", price: 180000, lead: "7 days" },
    { name: "Small chops platter (50 pcs)", price: 35000, lead: "24h" }, { name: "Corporate event catering (per head)", price: 6500, lead: "5 days" },
  ],
  hours: "Mon–Sat 8:00–19:00", delivery: "GRA, Old GRA, Trans-Amadi, Rumuola, Elelenwo, Woji — ₦3,000; Choba/Eleme ₦5,000",
  authorised: ["prices", "availability", "bookings", "order status", "delivery areas", "rescheduling", "payment by transfer"],
};
export const SYSTEM_SCOPE = `You are the customer-service and booking agent for ${BUSINESS.name} in ${BUSINESS.city}. You ONLY reply to customers who messaged the business first. Stay strictly on the business's services, prices, orders, delivery and bookings. Services: ${BUSINESS.services.map((s) => `${s.name} ₦${s.price.toLocaleString()} (lead time ${s.lead})`).join("; ")}. Hours: ${BUSINESS.hours}. Delivery: ${BUSINESS.delivery}. If asked anything outside these topics (general chat, medical, legal, politics, other businesses), politely decline and offer a human. Always end with: "Reply HUMAN anytime to talk to Amaka." Keep replies under 70 words, warm, Nigerian-English friendly. Never invent prices.`;
export type Lead = { id: string; name: string; company: string; source: string; email: string; phone: string; note: string; score: number; dup?: boolean };
export const RAW_LEADS: Lead[] = [
  { id: "l1", name: "Tonye Briggs", company: "Briggs Events Ltd", source: "FB Lead Ad", email: "tonye@briggsevents.ng", phone: "0803 111 2222", note: "Form: 'Need cakes for 3 weddings in December'", score: 0 },
  { id: "l2", name: "Ngozi Eze", company: "Woji Hotel & Suites", source: "IG Lead Ad", email: "ngozi.eze@wojihotel.ng", phone: "0805 222 3333", note: "Commented on Page post about small chops", score: 0 },
  { id: "l3", name: "tonye briggs ", company: "Briggs Events", source: "Page activity", email: "TONYE@BRIGGSEVENTS.NG", phone: "+2348031112222", note: "Liked 4 posts this week", score: 0 },
  { id: "l4", name: "Dr. Ibim Jack", company: "RiverCare Clinic", source: "Google search", email: "admin@rivercare.ng", phone: "0806 444 5555", note: "Website: staff appreciation day every Q4", score: 0 },
  { id: "l5", name: "Chidi Okafor", company: "Trans-Amadi Logistics", source: "Maps listing", email: "hr@talogistics.ng", phone: "0809 555 6666", note: "Google Maps: 120 staff, new office opened Oct 2026", score: 0 },
  { id: "l6", name: "Blessing Amadi", company: "PH Brides Directory", source: "Public directory", email: "", phone: "0810 666 7777", note: "Wedding planner listed in VConnect", score: 0 },
];
export const INBOX = {
  whatsapp: [{ from: "customer", text: "Good evening! Can I get a 6-inch birthday cake ready for Saturday? Chocolate please 🎂" }],
  messenger: [{ from: "customer", text: "Hi, do you deliver small chops to Woji? Need 50 pcs for Friday." }],
  instagram: [{ from: "customer", text: "Saw your red velvet post 😍 what's the price for a wedding cake, 3 tiers?" }],
};
export const SLOTS = ["Fri 10:00", "Fri 15:00", "Sat 09:00", "Sat 12:00", "Sat 16:00", "Mon 11:00"];
