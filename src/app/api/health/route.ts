import { providerStatus } from "@/lib/ai";
import { channelStatus } from "@/lib/meta";
import { backend } from "@/lib/store";
export const dynamic = "force-dynamic";
const has = (k: string) => !!process.env[k];
export async function GET() { return Response.json({ ok: true, ai: providerStatus(), db: backend(), channels: channelStatus(),
  voice: { muse: has("MUSE_VOICE_API_URL"), seamless: has("SEAMLESS_API_URL") || has("HF_TOKEN") },
  payments: { paystack: has("PAYSTACK_SECRET_KEY"), stripe: has("STRIPE_SECRET_KEY") }, capi: has("META_CAPI_TOKEN"), deploy: { vercel: has("VERCEL_TOKEN"), netlify: has("NETLIFY_TOKEN"), github: has("GITHUB_TOKEN") } }); }
