import { channelStatus } from "@/lib/meta";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json(channelStatus()); }
