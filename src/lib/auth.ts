// Free, self-hosted auth: scrypt password hashes + HMAC-signed httpOnly session cookie. No 3rd-party cost.
import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { loadGlobal, saveGlobal } from "./store";
const SECRET = () => process.env.AUTH_SECRET || crypto.createHash("sha256").update("salescrew:" + (process.env.META_APP_SECRET ?? "dev")).digest("hex");
const sign = (v: string) => crypto.createHmac("sha256", SECRET()).update(v).digest("base64url");
export type Session = { uid: string; ws: string; name: string; email: string; role: string } | null;
export async function getSession(): Promise<Session> {
  const c = (await cookies()).get("sc_session")?.value; if (!c) return null;
  const [p, s] = c.split("."); if (!p || !s || sign(p) !== s) return null;
  try { const j = JSON.parse(Buffer.from(p, "base64url").toString()); return j.exp > Date.now() ? j : null; } catch { return null; }
}
export const workspaceId = async () => (await getSession())?.ws ?? "demo";
async function setSession(s: NonNullable<Session>) {
  const p = Buffer.from(JSON.stringify({ ...s, exp: Date.now() + 30 * 864e5 })).toString("base64url");
  (await cookies()).set("sc_session", `${p}.${sign(p)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400 });
}
const hash = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 32).toString("hex");
export async function signup(email: string, password: string, name: string, company: string) {
  const g = await loadGlobal(); email = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) throw new Error("Valid email and 8+ char password required");
  if (g.users.some((u) => u.email === email)) throw new Error("Account exists — sign in instead");
  const salt = crypto.randomBytes(16).toString("hex"); const id = "u_" + crypto.randomBytes(6).toString("hex"); const ws = "ws_" + crypto.randomBytes(6).toString("hex");
  g.users.push({ id, email, name, salt, hash: hash(password, salt), workspaceId: ws, role: "owner", createdAt: new Date().toISOString() });
  g.workspaces.push({ id: ws, name: company || `${name}'s workspace`, createdAt: new Date().toISOString() }); await saveGlobal(g);
  await setSession({ uid: id, ws, name, email, role: "owner" }); return { ws };
}
export async function login(email: string, password: string) {
  const g = await loadGlobal(); const u = g.users.find((x) => x.email === email.trim().toLowerCase());
  if (!u || !crypto.timingSafeEqual(Buffer.from(hash(password, u.salt)), Buffer.from(u.hash))) throw new Error("Invalid email or password");
  await setSession({ uid: u.id, ws: u.workspaceId, name: u.name, email: u.email, role: u.role }); return { ws: u.workspaceId };
}
export async function logout() { (await cookies()).delete("sc_session"); }
