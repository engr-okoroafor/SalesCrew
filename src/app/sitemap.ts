import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const b = "https://salescrew.vercel.app"; const now = new Date();
  return ["", "/login", "/privacy", "/terms", "/data-deletion", "/app/inbox", "/app/products", "/app/sites"].map((p, i) => ({ url: b + p, lastModified: now, changeFrequency: "weekly", priority: i ? 0.6 : 1 }));
}
