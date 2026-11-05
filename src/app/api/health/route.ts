import { providerStatus } from "@/lib/ai";
import { channelStatus } from "@/lib/meta";
import { backend } from "@/lib/store";
import { voiceStatus } from "@/lib/voice";
export const dynamic = "force-dynamic";
const has = (k: string) => !!process.env[k];
export async function GET() { return Response.json({ ok: true, ai: providerStatus(), db: backend(), channels: channelStatus(),
  voice: voiceStatus(),
  payments: { paystack: has("PAYSTACK_SECRET_KEY"), stripe: has("STRIPE_SECRET_KEY") }, capi: has("META_CAPI_TOKEN"), deploy: { vercel: has("VERCEL_TOKEN"), netlify: has("NETLIFY_TOKEN"), github: has("GITHUB_TOKEN") } }); }
