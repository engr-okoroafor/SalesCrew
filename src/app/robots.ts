import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/app/settings"] }], sitemap: "https://salescrew.vercel.app/sitemap.xml" }; }
