import { getSession, login, logout, signup } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ session: await getSession() }); }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  try { if (b.action === "logout") { await logout(); return Response.json({ ok: true }); }
    const r = b.action === "signup" ? await signup(b.email, b.password, b.name ?? "", b.company ?? "") : await login(b.email, b.password);
    return Response.json({ ok: true, ...r }); } catch (e) { return Response.json({ ok: false, error: (e as Error).message }, { status: 400 }); }
}
