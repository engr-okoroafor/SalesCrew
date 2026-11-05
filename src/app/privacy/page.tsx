import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/LegalDoc";
import { POLICY_CONTACT, POLICY_UPDATED } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What SalesCrew and Rise & Eat collect from WhatsApp, Messenger, and Instagram messages, why, and how to ask for deletion.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const { operator, business, city, email } = POLICY_CONTACT;
  return (
    <LegalDoc
      title="Privacy Policy"
      updated={POLICY_UPDATED}
      lede="SalesCrew is an AI sales inbox for local businesses. It reads and answers WhatsApp, Messenger, and Instagram messages, takes bookings, and can auto-reply when the business turns that on. Rise & Eat, Port Harcourt, is the featured business on this site."
    >
      <section>
        <h2>Who we are</h2>
        <p className="mt-2">
          {operator} operates SalesCrew for {business}, {city}. For privacy questions or a deletion request, email{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul className="mt-2">
          <li>Messages you send the business on WhatsApp, Messenger, or Instagram, including photos you attach in the chat.</li>
          <li>Contact details you share in that chat, such as your name, phone number, email, and notes about a booking or delivery.</li>
          <li>The name and email you give us if you create a SalesCrew account for your own business.</li>
          <li>The channel id Meta sends with a message, so the reply goes back to the same chat.</li>
        </ul>
        <p className="mt-2">You do not need a SalesCrew account to message the business.</p>
      </section>
      <section>
        <h2>Why we use it</h2>
        <p className="mt-2">
          We use this information to reply to your messages, take bookings, send a payment link when you ask to pay, and auto-reply when that business has auto-reply turned on. Someone at the business can take the chat over. Reply HUMAN in the thread if you want a person.
        </p>
      </section>
      <section>
        <h2>Meta Platform data</h2>
        <p className="mt-2">
          Information we receive from WhatsApp, Messenger, and Instagram is used only to provide that messaging service: to read the message you sent the business and to send the reply. We do not sell personal data. We do not use Meta Platform data to advertise to you, to build profiles for other companies, or for anything other than this inbox, bookings, and the related customer-service messages.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p className="mt-2">
          We keep a conversation, and the booking details in it, while the business needs them to finish your order and answer a follow-up. A SalesCrew account email stays until that workspace is closed or you ask us to delete it. You can ask at any time. We aim to delete within 30 days of a clear request. The steps are on the <Link href="/data-deletion">data deletion page</Link>.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p className="mt-2">
          {operator}<br />
          {business}, {city}<br />
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </section>
    </LegalDoc>
  );
}
