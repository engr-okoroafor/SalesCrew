import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/LegalDoc";
import { POLICY_CONTACT, POLICY_UPDATED } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using SalesCrew and for messaging Rise & Eat, Port Harcourt, through WhatsApp, Messenger, or Instagram.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const { operator, business, city, email } = POLICY_CONTACT;
  return (
    <LegalDoc
      title="Terms of Use"
      updated={POLICY_UPDATED}
      lede="These terms cover the SalesCrew website and messages you send to Rise & Eat, or to another business using SalesCrew, on WhatsApp, Messenger, or Instagram."
    >
      <section>
        <h2>The service</h2>
        <p className="mt-2">
          SalesCrew helps a business answer customer messages, keep bookings, and show its services. {business}, {city}, is the featured business on this site. These public pages do not list menu prices. A price in a chat is a quote from the business, and the business confirms it before you pay.
        </p>
      </section>
      <section>
        <h2>Using it</h2>
        <p className="mt-2">
          Use the inbox to ask about that business&apos;s own food, events, and orders. Do not use it to break the service, send unlawful content, or pretend to be someone else. If you open a SalesCrew workspace, you are responsible for the business details you enter and for the WhatsApp, Facebook, or Instagram accounts you connect.
        </p>
      </section>
      <section>
        <h2>Automated replies</h2>
        <p className="mt-2">
          Some replies are written by an assistant that is limited to that business&apos;s services, bookings, and orders. It can be wrong. Check anything important with the business. Reply HUMAN in the chat if you want a person.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p className="mt-2">
          Keep your login to yourself. We can close a workspace that breaks these terms or that we can no longer run.
        </p>
      </section>
      <section>
        <h2>Availability</h2>
        <p className="mt-2">
          The site and inbox are provided as available. A missed message or a wrong quote should be checked with the business before you rely on it. Nothing here removes a right the law gives you.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p className="mt-2">
          {operator}, {business}, {city}. Email <a href={`mailto:${email}`}>{email}</a>. How we handle personal information is in the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalDoc>
  );
}
