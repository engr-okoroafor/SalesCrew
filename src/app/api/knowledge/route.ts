// Vendor knowledge base: POST multipart (vendorId, text?, file[]) → extracted text appended to vendor.knowledge; DELETE ?vendorId&name removes a doc. The agent reads it via vendorScope().
import { workspaceId } from "@/lib/auth";
import { mutate, putMedia } from "@/lib/store";
import { extractText } from "@/lib/knowledge";
import { audit } from "@/lib/pipeline";
export const runtime = "nodejs"; export const maxDuration = 60;
const strip = <T extends { tokens?: unknown }>(v: T) => { const { tokens: _t, ...rest } = v; void _t; return rest; };
export async function POST(req: Request) {
  const f = await req.formData(); const vendorId = String(f.get("vendorId") ?? ""); const text = String(f.get("text") ?? "").trim(); const files = f.getAll("file") as File[]; const ws = await workspaceId(); const report: { name: string; chars: number; via: string }[] = [];
  const parts: { name: string; text: string; url?: string }[] = []; if (text) parts.push({ name: `Note ${new Date().toISOString().slice(0, 10)}`, text });
  for (const file of files.slice(0, 8)) { if (file.size > 15e6) { report.push({ name: file.name, chars: 0, via: "too large (15MB max)" }); continue; } const buf = await file.arrayBuffer(); const r = await extractText(file.name, file.type, buf).catch((e) => ({ text: "", via: `unreadable (${(e as Error).message.slice(0, 60)})` }));
    const url = file.type.startsWith("image/") || file.type === "application/pdf" ? await putMedia(file.name, buf, file.type).catch(() => undefined) : undefined; report.push({ name: file.name, chars: r.text.length, via: r.via }); if (r.text) parts.push({ name: file.name, text: r.text, url }); }
  if (!parts.length && !report.length) return Response.json({ error: "Nothing to save — type text or attach a file" }, { status: 400 });
  const w = await mutate(ws, async (w) => { const v = w.vendors.find((x) => x.id === vendorId) ?? w.vendors[0]; if (!v) return;
    for (const p of parts) { v.knowledge = `${v.knowledge ?? ""}\n\n### ${p.name}\n${p.text}`.trim().slice(-60000); (v.docs ??= []).push({ name: p.name, url: p.url, chars: p.text.length, at: new Date().toISOString() }); }
    audit(w, "admin", "knowledge.add", `${v.name}: ${parts.map((p) => p.name).join(", ")}`); });
  return Response.json({ report, vendors: w.vendors.map(strip) });
}
export async function PUT(req: Request) { const b = await req.json(); const w = await mutate(await workspaceId(), async (w) => { const v = w.vendors.find((x) => x.id === b.vendorId); if (v) { v.knowledge = String(b.knowledge ?? "").slice(0, 60000); audit(w, "admin", "knowledge.edit", v.name); } }); return Response.json({ vendors: w.vendors.map(strip) }); }
export async function DELETE(req: Request) { const u = new URL(req.url); const vid = u.searchParams.get("vendorId"); const name = u.searchParams.get("name") ?? "";
  const w = await mutate(await workspaceId(), async (w) => { const v = w.vendors.find((x) => x.id === vid); if (!v) return; v.docs = (v.docs ?? []).filter((d) => d.name !== name); v.knowledge = (v.knowledge ?? "").split(/\n\n(?=### )/).filter((s) => !s.startsWith(`### ${name}\n`)).join("\n\n"); });
  return Response.json({ vendors: w.vendors.map(strip) }); }
