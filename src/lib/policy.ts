import { RISE_EMAIL } from "./brand";

/** Public contact for the privacy, terms, and data-deletion pages. */
export const SITE = "https://salescrew.vercel.app";
export const POLICY_UPDATED = "5 November 2026";

/** Operator named on the marketing site. Email is the Rise & Eat address already in src/lib/brand.ts. */
export const POLICY_CONTACT = {
  operator: "Hilda Okoronkwo",
  business: "Rise & Eat",
  city: "Port Harcourt",
  email: RISE_EMAIL,
} as const;
