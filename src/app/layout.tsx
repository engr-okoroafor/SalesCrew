import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "SalesCrew — AI sales crew for small businesses", description: "Finds prospects, writes outreach, calls in any language, books meetings, answers WhatsApp/Messenger/IG — powered by Meta Muse Spark." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-screen antialiased">{children}</body></html>;
}
