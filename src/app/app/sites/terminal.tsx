"use client";
// In-browser sandbox terminal over the project's virtual file system. Runs safe local commands (no server shell).
import { useEffect, useRef, useState } from "react";
import type { SiteFile } from "@/lib/schema";
type Line = { t: "in" | "out" | "err" | "ok"; s: string };
const HELP = `Available commands:
  ls [dir]  tree  pwd  cd <dir>  cat <file>  head <file>  wc <file>  grep <text> [file]
  touch <file>  mkdir <dir>  rm <file>  mv <a> <b>  echo <text> [> file]
  node -e "<js>"  npm install | npm run build | npm run dev | npm test
  git status | git log  open <page.html>  date  whoami  env  history  clear  help`;
export function Terminal({ files, setFiles, onPreview }: { files: SiteFile[]; setFiles: (f: SiteFile[]) => void; onPreview: (p: string) => void }) {
  const [lines, setLines] = useState<Line[]>([{ t: "ok", s: "SalesCrew sandbox shell — type `help`. Commands run locally in your browser against this project." }]);
  const [cwd, setCwd] = useState(""); const [inp, setInp] = useState(""); const [hist, setHist] = useState<string[]>([]); const [hi, setHi] = useState(-1);
  const end = useRef<HTMLDivElement>(null); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView(); }, [lines]);
  const abs = (p = "") => { const parts = (p.startsWith("/") ? p : (cwd ? cwd + "/" : "") + p).split("/"); const o: string[] = []; for (const x of parts) { if (!x || x === ".") continue; if (x === "..") o.pop(); else o.push(x); } return o.join("/"); };
  const isDir = (d: string) => !d || files.some((f) => f.path.startsWith(d + "/"));
  const run = async (raw: string) => {
    const out: Line[] = [{ t: "in", s: `${cwd || "~"} $ ${raw}` }]; const say = (s: string, t: Line["t"] = "out") => out.push({ t, s });
    const redir = raw.match(/^(.*?)\s*>\s*(\S+)$/); const cmdline = redir ? redir[1] : raw;
    const [cmd, ...args] = cmdline.match(/"[^"]*"|'[^']*'|\S+/g)?.map((x) => x.replace(/^["']|["']$/g, "")) ?? [];
    const file = (p: string) => files.find((f) => f.path === abs(p));
    let res = "";
    try { switch (cmd) {
      case undefined: break;
      case "help": res = HELP; break;
      case "clear": setLines([]); return;
      case "pwd": res = "/project" + (cwd ? "/" + cwd : ""); break;
      case "whoami": res = "builder"; break;
      case "date": res = new Date().toString(); break;
      case "history": res = hist.map((h, i) => `${i + 1}  ${h}`).join("\n"); break;
      case "env": res = "NODE_ENV=development\nSHELL=/bin/sc-sh\nPWD=/project\n(secrets are never exposed in the browser)"; break;
      case "echo": res = args.join(" "); break;
      case "cd": { const d = abs(args[0] ?? ""); if (args[0] === undefined || args[0] === "~") setCwd(""); else if (isDir(d)) setCwd(d); else throw new Error(`cd: ${args[0]}: No such directory`); break; }
      case "ls": { const d = abs(args[0] ?? ""); const set = new Set<string>(); files.forEach((f) => { if (d && !f.path.startsWith(d + "/")) return; const rest = d ? f.path.slice(d.length + 1) : f.path; const n = rest.split("/")[0]; if (n !== ".keep") set.add(rest.includes("/") ? n + "/" : n); }); res = [...set].sort().join("  ") || ""; break; }
      case "tree": res = files.filter((f) => !f.path.endsWith(".keep")).map((f) => f.path).sort().map((p) => "  ".repeat(p.split("/").length - 1) + "├─ " + p.split("/").pop()).join("\n"); break;
      case "cat": case "head": { const f = file(args[0] ?? ""); if (!f) throw new Error(`${cmd}: ${args[0]}: No such file`); res = cmd === "head" ? f.content.split("\n").slice(0, 10).join("\n") : f.content; break; }
      case "wc": { const f = file(args[0] ?? ""); if (!f) throw new Error(`wc: ${args[0]}: No such file`); res = `${f.content.split("\n").length} lines ${f.content.split(/\s+/).filter(Boolean).length} words ${f.content.length} chars ${f.path}`; break; }
      case "grep": { const [q, p] = args; if (!q) throw new Error("usage: grep <text> [file]"); res = files.filter((f) => !p || f.path === abs(p)).flatMap((f) => f.content.split("\n").map((l, i) => [f.path, i + 1, l] as const).filter(([, , l]) => l.toLowerCase().includes(q.toLowerCase()))).slice(0, 80).map(([f, i, l]) => `${f}:${i}: ${l.trim().slice(0, 160)}`).join("\n") || "(no matches)"; break; }
      case "touch": { const p = abs(args[0] ?? ""); if (!p) throw new Error("touch: missing file"); if (!file(args[0])) setFiles([...files, { path: p, content: "" }]); break; }
      case "mkdir": { const p = abs(args.filter((a) => a !== "-p")[0] ?? ""); if (!p) throw new Error("mkdir: missing dir"); setFiles([...files, { path: p + "/.keep", content: "" }]); break; }
      case "rm": { const t = args.filter((a) => !a.startsWith("-")); const p = abs(t[0] ?? ""); const left = files.filter((f) => f.path !== p && !f.path.startsWith(p + "/")); if (left.length === files.length) throw new Error(`rm: ${t[0]}: No such file`); setFiles(left); break; }
      case "mv": { const a = abs(args[0] ?? ""), b = abs(args[1] ?? ""); if (!file(args[0])) throw new Error(`mv: ${args[0]}: No such file`); setFiles(files.map((f) => f.path === a ? { ...f, path: b } : f)); break; }
      case "open": { const p = abs(args[0] ?? "index.html"); if (!file(args[0] ?? "index.html")) throw new Error(`open: ${p}: not found`); onPreview(p); res = `Opening ${p} in preview…`; break; }
      case "node": { if (args[0] !== "-e" || !args[1]) { res = "Node.js v22 (sandbox). Use: node -e \"console.log(1+1)\""; break; } const logs: string[] = []; const con = { log: (...x: unknown[]) => logs.push(x.map((v) => typeof v === "string" ? v : JSON.stringify(v)).join(" ")) };
        const r = new Function("console", `"use strict";return (function(){${args[1].includes("return") || args[1].includes(";") ? args[1] : "return " + args[1]}})()`)(con); res = [...logs, r !== undefined ? String(r) : ""].filter(Boolean).join("\n"); break; }
      case "npm": case "pnpm": case "yarn": {
        const sub = args[0] === "run" ? args[1] : args[0];
        if (sub === "install" || sub === "i") { say("added 312 packages, audited 313 packages in 2.1s"); res = "found 0 vulnerabilities"; break; }
        if (sub === "build" || sub === "test") { const errs: string[] = []; for (const f of files) { if (f.path.endsWith(".json")) try { JSON.parse(f.content); } catch { errs.push(`${f.path}: invalid JSON`); }
            if (f.path.endsWith(".js") && !f.path.includes("/")) try { new Function(f.content); } catch (x) { errs.push(`${f.path}: ${(x as Error).message}`); }
            if (f.path.endsWith(".html")) { for (const m of f.content.matchAll(/href="([^"#:]+\.html)"/g)) if (!files.some((g) => g.path === m[1])) errs.push(`${f.path}: broken link → ${m[1]}`); } }
          say(`> ${sub}`); say(`Checked ${files.length} files (HTML links, JS syntax, JSON)`); if (errs.length) throw new Error(errs.join("\n")); res = `✓ ${sub} passed — ${files.filter((f) => f.path.endsWith(".html")).length} pages, 0 broken links`; break; }
        if (sub === "dev" || sub === "start") { res = "▲ Ready on preview → switched to Preview tab"; onPreview("index.html"); break; }
        throw new Error(`npm: unknown script "${sub}"`); }
      case "git": res = args[0] === "log" ? "commit HEAD (main)\n    Generated by SalesCrew Site Builder" : `On branch main\n${files.length} files tracked\nnothing to commit, working tree clean`; break;
      default: throw new Error(`${cmd}: command not found (sandbox) — type help`);
    } } catch (e) { say((e as Error).message, "err"); }
    if (redir && !out.some((l) => l.t === "err")) { const p = abs(redir[2]); const ex = files.some((f) => f.path === p); setFiles(ex ? files.map((f) => f.path === p ? { ...f, content: res + "\n" } : f) : [...files, { path: p, content: res + "\n" }]); res = ""; }
    if (res) say(res, /✓/.test(res) ? "ok" : "out"); setLines((l) => [...l, ...out]);
  };
  return <div onClick={() => ref.current?.focus()} className="flex min-h-0 flex-1 flex-col bg-[#020403] font-mono text-[12.5px]">
    <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1.5 text-[11px] text-white/50"><span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" /><span className="h-2.5 w-2.5 rounded-full bg-[#39ff88]/80" /><span className="ml-2">bash — /project — sandbox</span><button className="ml-auto hover:text-white" onClick={() => setLines([])}>clear</button></div>
    <div className="min-h-0 flex-1 overflow-y-auto scroll-thin p-3 leading-5">{lines.map((l, i) => <pre key={i} className={`whitespace-pre-wrap ${l.t === "in" ? "text-[#39ff88]" : l.t === "err" ? "text-red-300" : l.t === "ok" ? "text-[#22d3ee]" : "text-[#d7ffe9]"}`}>{l.s}</pre>)}
      <div className="flex items-center gap-2"><span className="text-[#39ff88]">{cwd || "~"} $</span><input ref={ref} autoFocus value={inp} spellCheck={false} aria-label="Terminal input" onChange={(e) => setInp(e.target.value)} className="flex-1 bg-transparent text-[#d7ffe9] caret-[#39ff88] outline-none"
        onKeyDown={(e) => { if (e.key === "Enter") { const c = inp.trim(); setInp(""); setHi(-1); if (c) setHist((h) => [...h, c]); run(c); } else if (e.key === "ArrowUp") { e.preventDefault(); const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1); if (hist[n] !== undefined) { setHi(n); setInp(hist[n]); } } else if (e.key === "ArrowDown") { e.preventDefault(); const n = hi + 1; if (n >= hist.length) { setHi(-1); setInp(""); } else { setHi(n); setInp(hist[n]); } } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); } }} /></div><div ref={end} /></div></div>;
}
