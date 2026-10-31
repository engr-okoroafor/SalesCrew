import { prefer } from "@/lib/ai";
import { agentReply } from "@/lib/agent";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const r = await agentReply(String(b.channel ?? "whatsapp"), Array.isArray(b.history) ? b.history : [], prefer(b.provider));
  return Response.json(r);
}
