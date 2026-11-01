// Persistent multi-tenant store. Backend priority:
//   1. DATABASE_URL (Neon Postgres, free tier) — table sc_docs(key text pk, doc jsonb)
//   2. BLOB_READ_WRITE_TOKEN (Vercel Blob, free tier, private store) — one JSON doc per workspace
//   3. Local file (.data/) for dev — never used on Vercel unless both above are missing (then /tmp, ephemeral)
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { seedWorkspace, type Workspace } from "./schema";

export type Backend = "postgres" | "blob" | "file";
export const backend = (): Backend => (process.env.DATABASE_URL ? "postgres" : process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "file");
const cache = new Map<string, { at: number; doc: Workspace }>();

async function pg() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  await sql`create table if not exists sc_docs (key text primary key, doc jsonb not null, updated_at timestamptz default now())`;
  return sql;
}
const fileDir = () => (process.env.VERCEL ? "/tmp/salescrew" : path.join(process.cwd(), ".data"));

async function readRaw(key: string): Promise<Workspace | null> {
  const b = backend();
  if (b === "postgres") { const sql = await pg(); const r = await sql`select doc from sc_docs where key=${key}`; return (r[0]?.doc as Workspace) ?? null; }
  if (b === "blob") {
    const { get } = await import("@vercel/blob");
    try { const r = await get(`ws/${key}.json`, { access: "private", useCache: false } as never); if (!r) return null;
      const txt = await new Response((r as { stream: ReadableStream }).stream).text(); return JSON.parse(txt); } catch { return null; }
  }
  try { return JSON.parse(await fs.readFile(path.join(fileDir(), `${key}.json`), "utf8")); } catch { return null; }
}
async function writeRaw(key: string, doc: Workspace) {
  const b = backend();
  if (b === "postgres") { const sql = await pg(); await sql`insert into sc_docs(key, doc, updated_at) values (${key}, ${JSON.stringify(doc)}::jsonb, now()) on conflict (key) do update set doc = excluded.doc, updated_at = now()`; return; }
  if (b === "blob") { const { put } = await import("@vercel/blob");
    await put(`ws/${key}.json`, JSON.stringify(doc), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" } as never); return; }
  await fs.mkdir(fileDir(), { recursive: true }); await fs.writeFile(path.join(fileDir(), `${key}.json`), JSON.stringify(doc));
}

export async function loadWorkspace(id: string): Promise<Workspace> {
  const c = cache.get(id); if (c && Date.now() - c.at < 1500) return c.doc;
  let doc = await readRaw(id);
  if (!doc) { doc = seedWorkspace(id); await writeRaw(id, doc); }
  cache.set(id, { at: Date.now(), doc }); return doc;
}
export async function saveWorkspace(doc: Workspace) { doc.updatedAt = new Date().toISOString(); cache.set(doc.id, { at: Date.now(), doc }); await writeRaw(doc.id, doc); }
export async function mutate(id: string, fn: (w: Workspace) => void | Promise<void>) { const w = structuredClone(await loadWorkspace(id)); await fn(w); await saveWorkspace(w); return w; }

// Global registry (users, workspace index, channel → vendor routing) lives under key "_global".
export type Global = { users: { id: string; email: string; name: string; hash: string; salt: string; workspaceId: string; role: "owner" | "admin" | "agent"; createdAt: string }[];
  routes: Record<string, { workspaceId: string; vendorId: string }>; workspaces: { id: string; name: string; createdAt: string }[] };
export async function loadGlobal(): Promise<Global> { const g = (await readRaw("_global")) as unknown as Global | null; return g ?? { users: [], routes: {}, workspaces: [{ id: "demo", name: "Demo workspace", createdAt: new Date().toISOString() }] }; }
export async function saveGlobal(g: Global) { await writeRaw("_global", g as unknown as Workspace); }

// Media uploads (photos/videos for products & chat). Private blob, served via /api/media proxy.
export async function putMedia(name: string, data: ArrayBuffer, type: string) {
  const safe = `media/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  if (backend() === "blob" || process.env.BLOB_READ_WRITE_TOKEN) { const { put } = await import("@vercel/blob");
    await put(safe, Buffer.from(data), { access: "private", contentType: type, addRandomSuffix: false } as never); return `/api/media?p=${encodeURIComponent(safe)}`; }
  await fs.mkdir(path.join(fileDir(), "media"), { recursive: true }); await fs.writeFile(path.join(fileDir(), safe), Buffer.from(data));
  return `/api/media?p=${encodeURIComponent(safe)}`;
}
export async function getMedia(p: string): Promise<{ body: ReadableStream | Buffer; type: string } | null> {
  if (!p.startsWith("media/") || p.includes("..")) return null;
  if (process.env.BLOB_READ_WRITE_TOKEN) { const { get } = await import("@vercel/blob"); const r = await get(p, { access: "private" } as never) as { stream: ReadableStream; blob?: { contentType?: string } } | null;
    return r ? { body: r.stream, type: r.blob?.contentType ?? "application/octet-stream" } : null; }
  try { return { body: await fs.readFile(path.join(fileDir(), p)), type: p.endsWith(".mp4") ? "video/mp4" : "image/jpeg" }; } catch { return null; }
}
