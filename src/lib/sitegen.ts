// Natural-language site/app builder. AI (Muse Spark → NVIDIA) returns a file tree; deterministic template fallback.
import { complete, type Provider } from "./ai";
import { parseJSON } from "./json";
import { uid, type Site, type SiteFile, type Workspace } from "./schema";
const THEMES: Record<string, { bg: string; accent: string; font: string; extra: string }> = {
  neon: { bg: "#05070a", accent: "#39ff88", font: "Inter", extra: "radial-gradient(800px 400px at 20% 0%,#0f3d2a,transparent),radial-gradient(700px 400px at 90% 10%,#1b1446,transparent)" },
  web3: { bg: "#07041a", accent: "#a855f7", font: "Space Grotesk", extra: "conic-gradient(from 180deg at 50% 0%,#1e0b4d,#07041a,#0b2a4d,#07041a)" },
  quantum: { bg: "#020617", accent: "#22d3ee", font: "Orbitron", extra: "radial-gradient(circle at 50% 30%,#0e7490 0%,transparent 45%),radial-gradient(circle at 80% 80%,#4c1d95,transparent 40%)" },
  luxury: { bg: "#0c0a09", accent: "#f5c542", font: "Playfair Display", extra: "radial-gradient(900px 500px at 50% -10%,#3b2a06,transparent)" },
  minimal: { bg: "#0b0f14", accent: "#e2e8f0", font: "Inter", extra: "none" },
};
export function templateSite(o: { name: string; kind: "web" | "mobile"; theme: string; features: string[]; products: { name: string; price: string; img: string; desc: string }[]; phone?: string; ig?: string; page?: string; tagline?: string }): SiteFile[] {
  const t = THEMES[o.theme] ?? THEMES.neon; const f = new Set(o.features); const wa = (o.phone ?? "").replace(/\D/g, "");
  const cards = o.products.map((p) => `<article class="card"><img src="${p.img}" alt="${p.name}" loading="lazy"/><div><h3>${p.name}</h3><p>${p.desc}</p><div class="row"><b>${p.price}</b>${f.has("payments") ? `<button onclick="pay('${p.name.replace(/'/g, "")}','${p.price}')">Buy</button>` : `<a href="https://wa.me/${wa}?text=${encodeURIComponent("Hi, I want " + p.name)}">Order</a>`}</div></div></article>`).join("\n");
  const meta = [f.has("whatsapp") && `<a class="chip wa" href="https://wa.me/${wa}">WhatsApp</a>`, f.has("messenger") && `<a class="chip ms" href="https://m.me/${o.page ?? ""}">Messenger</a>`, f.has("instagram") && `<a class="chip ig" href="https://ig.me/m/${o.ig ?? ""}">Instagram</a>`].filter(Boolean).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${o.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=${t.font.replace(/ /g, "+")}:wght@400;700;900&display=swap" rel="stylesheet"/><link rel="stylesheet" href="styles.css"/>${o.kind === "mobile" ? '<link rel="manifest" href="manifest.json"/>' : ""}</head>
<body class="${o.kind}"><div class="orb"></div>
<header><b class="logo">${o.name}</b>${f.has("auth") ? '<button id="authBtn" onclick="auth()">Sign in</button>' : ""}${f.has("web3") ? '<button onclick="connectWallet()" id="wallet">Connect wallet</button>' : ""}</header>
<section class="hero"><h1>${o.tagline ?? o.name}</h1><p>Order, book and pay in seconds — we reply instantly on your favourite app.</p><div class="chips">${meta}</div></section>
<section id="products" class="grid">${cards}</section>
${f.has("booking") ? `<section class="book"><h2>Book a slot</h2><form onsubmit="book(event)"><input name="name" placeholder="Your name" required/><input name="when" type="datetime-local" required/><button>Book</button></form></section>` : ""}
${o.kind === "mobile" ? '<nav class="tabbar"><a href="#">Home</a><a href="#products">Shop</a><a href="#" onclick="auth()">Me</a></nav>' : `<footer>© ${new Date().getFullYear()} ${o.name} · Built with SalesCrew</footer>`}
<script src="app.js"></script></body></html>`;
  const css = `:root{--a:${t.accent};--bg:${t.bg}}*{box-sizing:border-box}body{margin:0;font-family:'${t.font}',system-ui,sans-serif;background:${t.extra === "none" ? "" : t.extra + ","}var(--bg);color:#e8f0ff;min-height:100vh}
.orb{position:fixed;inset:auto -20vw -30vw auto;width:60vw;height:60vw;border-radius:50%;background:var(--a);filter:blur(140px);opacity:.15;animation:f 12s ease-in-out infinite alternate;pointer-events:none}@keyframes f{to{transform:translate(-20vw,-20vh)}}
header{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:18px 6vw;position:sticky;top:0;backdrop-filter:blur(14px);background:rgba(0,0,0,.25);z-index:5}.logo{font-size:20px;color:var(--a);text-shadow:0 0 18px var(--a)}
button,.row a{background:var(--a);color:#03140b;border:0;border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;box-shadow:0 0 24px color-mix(in srgb,var(--a) 40%,transparent);text-decoration:none}
.hero{padding:10vh 6vw 6vh;max-width:900px}.hero h1{font-size:clamp(34px,6vw,68px);line-height:1.05;margin:0 0 16px;background:linear-gradient(90deg,#fff,var(--a));-webkit-background-clip:text;color:transparent}
.chips{display:flex;gap:10px;flex-wrap:wrap}.chip{padding:8px 14px;border-radius:999px;color:#fff;text-decoration:none;font-weight:700}.wa{background:#25D366}.ms{background:#0084FF}.ig{background:linear-gradient(45deg,#f58529,#dd2a7b,#8134af)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;padding:0 6vw 8vh}.card{border-radius:20px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid color-mix(in srgb,var(--a) 25%,transparent);backdrop-filter:blur(12px);transition:.3s}.card:hover{transform:translateY(-4px);box-shadow:0 20px 60px -20px var(--a)}
.card img{width:100%;height:180px;object-fit:cover}.card div{padding:14px}.card h3{margin:0 0 6px}.card p{opacity:.75;font-size:14px}.row{display:flex;justify-content:space-between;align-items:center}
.book{padding:0 6vw 8vh}.book form{display:flex;gap:10px;flex-wrap:wrap}input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:12px;padding:10px}footer{padding:30px 6vw;opacity:.6}
body.mobile{max-width:430px;margin:0 auto;padding-bottom:70px}.mobile .grid{grid-template-columns:1fr 1fr;gap:10px}.mobile .card img{height:120px}.tabbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;display:flex;justify-content:space-around;padding:14px;background:rgba(0,0,0,.6);backdrop-filter:blur(16px)}.tabbar a{color:var(--a);text-decoration:none;font-weight:700}`;
  const js = `// Generated by SalesCrew Site Builder
const API = window.SALESCREW_API || "https://salescrew.vercel.app";
function pay(item, price){ ${f.has("payments") ? "fetch(API + '/api/pay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item,price,email:prompt('Email for receipt?')})}).then(r=>r.json()).then(j=>j.url?location.href=j.url:alert(j.message||'Payment link sent on WhatsApp'))" : "alert('Payments not enabled')"}; }
function auth(){ ${f.has("auth") ? "const e=prompt('Email');if(e){localStorage.user=e;document.getElementById('authBtn').textContent=e.split('@')[0];}" : ""} }
function book(e){ e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); ${f.has("database") ? "const all=JSON.parse(localStorage.bookings||'[]');all.push(d);localStorage.bookings=JSON.stringify(all);" : ""} alert('Booked! We will confirm on WhatsApp.'); }
async function connectWallet(){ ${f.has("web3") ? "if(!window.ethereum)return alert('Install a wallet (MetaMask)');const [a]=await ethereum.request({method:'eth_requestAccounts'});document.getElementById('wallet').textContent=a.slice(0,6)+'…'+a.slice(-4);" : ""} }
if (localStorage.user && document.getElementById('authBtn')) document.getElementById('authBtn').textContent = localStorage.user.split('@')[0];`;
  const files: SiteFile[] = [{ path: "index.html", content: html }, { path: "styles.css", content: css }, { path: "app.js", content: js },
    { path: "vercel.json", content: JSON.stringify({ cleanUrls: true }, null, 2) }, { path: "netlify.toml", content: `[build]\n  publish = "."\n` },
    { path: ".github/workflows/deploy.yml", content: `name: Deploy\non: { push: { branches: [main] } }\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npx vercel deploy --prod --yes --token \${{ secrets.VERCEL_TOKEN }}\n` },
    { path: "README.md", content: `# ${o.name}\nGenerated by SalesCrew Site Builder (${o.kind}, ${o.theme} theme).\nFeatures: ${o.features.join(", ")}\n\nDeploy: Vercel / Netlify / GitHub Pages. CI: .github/workflows/deploy.yml` }];
  if (o.kind === "mobile") files.push({ path: "manifest.json", content: JSON.stringify({ name: o.name, short_name: o.name.slice(0, 12), display: "standalone", background_color: t.bg, theme_color: t.accent, start_url: "." }, null, 2) },
    { path: "mobile/App.tsx", content: `// Expo / React Native shell — run: npx create-expo-app && replace App.tsx\nimport { WebView } from "react-native-webview";\nexport default function App() { return <WebView source={{ uri: "https://YOUR-DEPLOY-URL" }} />; }\n` });
  if (f.has("database")) files.push({ path: "db/schema.sql", content: "create table customers(id serial primary key, name text, email text, phone text, created_at timestamptz default now());\ncreate table orders(id serial primary key, customer_id int references customers, item text, amount numeric, status text);\ncreate table bookings(id serial primary key, name text, slot timestamptz);" });
  return files;
}
export async function generateSite(w: Workspace, b: { siteId?: string; prompt: string; kind?: "web" | "mobile"; theme?: string; features?: string[]; vendorId?: string; files?: SiteFile[] }, pv: Provider) {
  const prev = w.sites.find((s) => s.id === b.siteId); const v = w.vendors.find((x) => x.id === (b.vendorId ?? prev?.vendorId)) ?? w.vendors[0];
  const kind = b.kind ?? prev?.kind ?? "web"; const theme = b.theme ?? prev?.theme ?? "neon"; const features = b.features ?? prev?.features ?? ["whatsapp", "payments"];
  const prods = w.products.filter((p) => p.vendorId === v.id).map((p) => ({ name: p.name, price: `${p.currency === "NGN" ? "₦" : "$"}${p.price.toLocaleString()}`, img: p.media[0]?.url.startsWith("http") ? p.media[0].url : `https://image.pollinations.ai/prompt/${encodeURIComponent(p.name + " product photo")}?width=800&height=600&nologo=true`, desc: p.desc }));
  const base = (b.files?.length ? b.files : prev?.files) ?? templateSite({ name: v.name, kind, theme, features, products: prods, phone: v.channels.whatsapp?.display, page: v.channels.messenger?.pageId, ig: v.channels.instagram?.handle });
  const editable = base.filter((f) => /\.(html|css|js)$/.test(f.path) && !f.path.includes("/"));
  const r = await complete([{ role: "system", content: `You are an expert vibe-coding web/app builder (like v0/Lovable). You edit a static ${kind === "mobile" ? "mobile-first PWA (max-width 430px, bottom tab bar)" : "responsive website"} with files index.html, styles.css, app.js. Theme: ${theme}. Features to include: ${features.join(", ")}. Use real image URLs (Unsplash or https://image.pollinations.ai/prompt/<desc>). Keep WhatsApp/Messenger/IG links and pay() hooks. Return ONLY JSON {"summary":"what you changed","files":[{"path":"index.html","content":"..."},...]} with the full content of each file you changed.` },
    { role: "user", content: `Business: ${v.name} (${v.industry}, ${v.city}). Request: ${b.prompt}\nCurrent files:\n${editable.map((f) => `--- ${f.path}\n${f.content.slice(0, 6000)}`).join("\n")}` }], { max: 6000, prefer: pv, offline: "" });
  const j = parseJSON<{ summary?: string; files?: SiteFile[] }>(r.text, {});
  let files = base; let summary = j.summary ?? "";
  if (j.files?.length) { files = [...base]; for (const f of j.files) { if (!f?.path || typeof f.content !== "string") continue; const i = files.findIndex((x) => x.path === f.path); if (i >= 0) files[i] = f; else files.push(f); } }
  else if (!prev && !b.files?.length) summary = `Generated a ${theme} ${kind} ${kind === "mobile" ? "app" : "site"} for ${v.name} with ${features.join(", ")} (template engine${r.provider === "offline" ? " — AI offline" : ""}).`;
  else summary = summary || "AI could not apply that change — files unchanged. Try rephrasing.";
  const site: Site = { id: prev?.id ?? uid("s"), vendorId: v.id, name: prev?.name ?? `${v.name} ${kind}`, kind, theme, features, prompt: b.prompt, files, deployed: prev?.deployed ?? [], updatedAt: new Date().toISOString(),
    history: [...(prev?.history ?? []), { role: "user" as const, text: b.prompt, at: new Date().toISOString() }, { role: "ai" as const, text: summary, at: new Date().toISOString() }].slice(-40) };
  return { site, summary, provider: r.provider, model: r.model, fallback: r.fallback };
}
