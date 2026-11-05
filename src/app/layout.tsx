import "./globals.css";
import type { Metadata, Viewport } from "next";
const SITE = "https://salescrew.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "SalesCrew — AI sales crew & multi-vendor marketplace for local businesses | Rise & Eat", template: "%s · SalesCrew" },
  description: "List many businesses and services in one place. SalesCrew answers WhatsApp, Messenger & Instagram 24/7, finds leads, drafts outreach, books, takes payments and builds your website — featured vendor: Rise & Eat, Port Harcourt.",
  keywords: ["AI sales assistant", "WhatsApp auto reply", "multi-vendor marketplace", "list my business", "Port Harcourt bakery", "Rise & Eat", "catering Port Harcourt", "Instagram DM automation", "small business CRM Nigeria", "website builder"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: SITE, siteName: "SalesCrew", title: "SalesCrew — list your businesses & services, let AI sell for you", description: "Multi-vendor AI sales crew: WhatsApp, Messenger, Instagram inbox, leads, outreach, bookings, payments, website builder.", images: [{ url: "/brand/rise-and-eat-flyer.jpg", width: 640, height: 1063, alt: "Rise & Eat services board" }], locale: "en_NG" },
  twitter: { card: "summary_large_image", title: "SalesCrew — AI sales crew for local businesses", description: "List many businesses & services. AI answers every DM.", images: ["/brand/rise-and-eat-flyer.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  category: "business",
};
export const viewport: Viewport = { themeColor: "#05070a", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-screen antialiased">{children}</body></html>;
}
