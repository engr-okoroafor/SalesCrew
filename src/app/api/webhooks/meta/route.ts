import { verifySignature, parseInbound, sendMessage } from "@/lib/meta";
import { agentReply } from "@/lib/agent";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const paused = new Set<string>(); // threads handed to a human (per instance; use a DB in production)

// Webhook verification handshake (Meta App Dashboard → Webhooks → Verify and save)
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && process.env.META_VERIFY_TOKEN && p.get("hub.verify_token") === process.env.META_VERIFY_TOKEN)
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

// Inbound messages from WhatsApp Cloud API, Messenger and Instagram Messaging
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });
  let body: unknown; try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const results = [];
  for (const m of parseInbound(body)) {
    const key = `${m.channel}:${m.from}`;
    if (paused.has(key)) { results.push({ key, skipped: "human-handoff" }); continue; }
    const r = await agentReply(m.channel, [{ from: "customer", text: m.text }]);
    if (r.handoff && r.model === "handoff-policy") paused.add(key);
    results.push({ key, send: await sendMessage(m.channel, m.from, r.text) });
  }
  console.log("[meta-webhook]", JSON.stringify(results));
  return Response.json({ ok: true, handled: results.length });
}
