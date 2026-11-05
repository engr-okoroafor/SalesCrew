import { putMedia } from "@/lib/store";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const f = (await req.formData()).getAll("file") as File[]; const out = [];
  for (const file of f.slice(0, 10)) { if (file.size > 25e6) continue; if (!/^(image|video)\//.test(file.type)) continue;
    out.push({ url: await putMedia(file.name, await file.arrayBuffer(), file.type), type: file.type.startsWith("video") ? "video" : "image", name: file.name }); }
  return Response.json({ files: out });
}
