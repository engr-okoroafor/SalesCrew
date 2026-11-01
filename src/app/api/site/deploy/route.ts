// Deploy generated site: Vercel (VERCEL_TOKEN), Netlify (NETLIFY_TOKEN), GitHub (GITHUB_TOKEN → repo + Actions CI). Else export bundle.
import { workspaceId } from "@/lib/auth";
import { loadWorkspace, mutate } from "@/lib/store";
import { audit } from "@/lib/pipeline";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); const w = await loadWorkspace(ws); const s = w.sites.find((x) => x.id === b.siteId);
  if (!s) return Response.json({ error: "site not found" }, { status: 404 }); const target = b.target ?? "vercel"; const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  let url: string | undefined, status = "exported", message = "";
  try {
    if (target === "vercel" && process.env.VERCEL_TOKEN) { const r = await fetch(`https://api.vercel.com/v13/deployments${process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ""}`, { method: "POST", headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: `sc-${slug}`, target: "production", files: s.files.map((f) => ({ file: f.path, data: f.content })), projectSettings: { framework: null } }) });
      const j = await r.json(); url = j.url ? `https://${j.url}` : undefined; status = url ? "deployed" : "error"; message = j.error?.message ?? ""; }
    else if (target === "netlify" && process.env.NETLIFY_TOKEN) { const { default: JSZip } = await import("jszip").catch(() => ({ default: null as never })); if (!JSZip) throw new Error("zip unavailable");
      const z = new JSZip(); s.files.forEach((f) => z.file(f.path, f.content)); const buf = await z.generateAsync({ type: "arraybuffer" });
      const r = await fetch("https://api.netlify.com/api/v1/sites", { method: "POST", headers: { Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`, "Content-Type": "application/zip" }, body: buf }); const j = await r.json(); url = j.ssl_url ?? j.url; status = url ? "deployed" : "error"; message = j.message ?? ""; }
    else if (target === "github" && process.env.GITHUB_TOKEN) { const H = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" };
      const repo = await (await fetch("https://api.github.com/user/repos", { method: "POST", headers: H, body: JSON.stringify({ name: `sc-${slug}-${Date.now().toString(36)}`, auto_init: false }) })).json();
      if (!repo.full_name) throw new Error(repo.message ?? "repo create failed");
      for (const f of s.files) await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${f.path}`, { method: "PUT", headers: H, body: JSON.stringify({ message: `add ${f.path}`, content: Buffer.from(f.content).toString("base64") }) });
      url = repo.html_url; status = "deployed"; message = "Repo created with .github/workflows/deploy.yml (add VERCEL_TOKEN secret for CI/CD)"; }
    else message = `Set ${target === "vercel" ? "VERCEL_TOKEN" : target === "netlify" ? "NETLIFY_TOKEN" : "GITHUB_TOKEN"} to deploy directly. Download the bundle meanwhile.`;
  } catch (e) { status = "error"; message = (e as Error).message; }
  const nw = await mutate(ws, (w) => { const x = w.sites.find((y) => y.id === s.id)!; x.deployed = [{ target, url, at: new Date().toISOString(), status }, ...(x.deployed ?? [])].slice(0, 10); audit(w, "site", `deploy.${target}`, `${s.name} ${status}`); });
  return Response.json({ url, status, message, files: status === "exported" ? s.files : undefined, sites: nw.sites });
}
