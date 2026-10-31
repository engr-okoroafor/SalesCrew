// Service photos (Unsplash, free licence). Local copies in /public/photos for the hero.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
export const HERO = "/photos/hero-cake.jpg";
export const SERVICES = [
  { title: "Custom celebration cakes", desc: "Birthday, wedding & tiered cakes — from ₦25,000.", img: u("1535141192574-5d4897c12636"), tip: "Most-asked on Instagram DM" },
  { title: "Event catering & small chops", desc: "Buffets, small chops trays and jollof for 20–500 guests.", img: "/photos/catering.jpg", tip: "Quoted instantly on Messenger" },
  { title: "Event styling & setup", desc: "Weddings, owambe and corporate tables, styled end-to-end.", img: "/photos/events.jpg", tip: "Booked via the agent's calendar" },
  { title: "Same-day dispatch delivery", desc: "Rider delivery across Port Harcourt — GRA, Woji, Rumuola.", img: u("1617347454431-f49d7ff5c3b1"), tip: "Order status answered on WhatsApp" },
  { title: "Tasting & consultations", desc: "Book a tasting or a planning call with Amaka.", img: u("1600880292203-757bb62b4baf"), tip: "Human handoff anytime — reply HUMAN" },
];
export const GALLERY = [
  u("1578985545062-69928b1d9587", 600), u("1464349095431-e9a21285b5f3", 600), u("1586985289688-ca3cf47d3e6e", 600),
  u("1517433670267-08bbd4be890f", 600), u("1621303837174-89787a7d4729", 600), u("1530103862676-de8c9debad1d", 600),
];
