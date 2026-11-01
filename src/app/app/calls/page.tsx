import { redirect } from "next/navigation";
// Call Lab merged into Engage (/app/outreach).
export default async function C({ searchParams }: { searchParams: Promise<Record<string, string>> }) { const s = await searchParams; redirect(`/app/outreach?mode=call${s.lead ? `&leads=${s.lead}` : ""}`); }
