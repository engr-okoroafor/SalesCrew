import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/LegalDoc";
import { POLICY_CONTACT, POLICY_UPDATED, SITE } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Data deletion",
  description: "How to ask SalesCrew to delete Facebook, Instagram, or WhatsApp data linked to your messages or connected account.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  const { operator, business, city, email } = POLICY_CONTACT;
  return (
    <LegalDoc
      title="User data deletion"
      updated={POLICY_UPDATED}
      lede="If you messaged a business through SalesCrew on Facebook Messenger, Instagram, or WhatsApp, or you connected one of those accounts to SalesCrew, email us and we will delete the data we stored from that use."
    >
      <section>
        <h2>How to ask</h2>
        <p className="mt-2">
          Email <a href={`mailto:${email}?subject=Data%20deletion`}>{email}</a> with the subject &quot;Data deletion&quot;. This address is {operator} at {business}, {city}.
        </p>
        <ul className="mt-2">
          <li>Say whether it was Facebook, Instagram, or WhatsApp.</li>
          <li>Give the name, username, or phone number on that chat.</li>
          <li>Name the business you messaged, for example {business}.</li>
          <li>If you have a SalesCrew login, include that account email too.</li>
        </ul>
      </section>
      <section>
        <h2>What happens next</h2>
        <p className="mt-2">
          We delete the messages, the contact details you shared in that chat, and the Facebook, Instagram, or WhatsApp identifiers we stored for you. If you ask us to remove a connected Page, Instagram account, or WhatsApp number, we also delete the access token stored for that connection.
        </p>
        <p className="mt-2">
          We email you when it is done. We aim to finish within 30 days. If a payment you already started has to stay on record for the payment provider or for a legal duty, we delete the rest and tell you what we had to keep.
        </p>
        <p className="mt-2">
          Removing SalesCrew in your Facebook or Instagram settings does not erase the copy of the chat we already stored. Send the email so we can delete it.
        </p>
      </section>
      <section>
        <h2>This page</h2>
        <p className="mt-2">
          Meta app data-deletion instructions: <a href={`${SITE}/data-deletion`}>{SITE}/data-deletion</a>. Related: <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.
        </p>
      </section>
    </LegalDoc>
  );
}
