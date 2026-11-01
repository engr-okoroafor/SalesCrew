"use client";
// Full-page translation via Google Translate element (free). Default en-US; IP-based suggestion from /api/geo.
import { useEffect, useState } from "react";
export const LANGS: [string, string][] = [["en", "English (US)"], ["fr", "Français"], ["es", "Español"], ["pt", "Português"], ["de", "Deutsch"], ["ar", "العربية"], ["zh-CN", "中文"], ["hi", "हिन्दी"], ["ja", "日本語"], ["ko", "한국어"], ["ru", "Русский"], ["it", "Italiano"], ["tr", "Türkçe"], ["sw", "Kiswahili"], ["yo", "Yorùbá"], ["ig", "Igbo"], ["ha", "Hausa"], ["nl", "Nederlands"], ["id", "Bahasa Indonesia"]];
const setCookie = (l: string) => { const v = l === "en" ? "" : `/en/${l}`; for (const d of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `googtrans=${v}; path=/${d}${v ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT"}`; };
export default function Translate({ compact }: { compact?: boolean }) {
  const [lang, setLang] = useState("en"); const [hint, setHint] = useState<string | null>(null);
  useEffect(() => { const saved = localStorage.getItem("sc_lang"); if (saved) setLang(saved);
    else fetch("/api/geo").then((r) => r.json()).then((g) => { const s = (g.suggested ?? "en").split("-")[0]; const code = s === "zh" ? "zh-CN" : s; if (code !== "en" && LANGS.some((x) => x[0] === code)) setHint(code); }).catch(() => {});
    if ((saved ?? "en") !== "en" && !document.getElementById("gt-s")) load(); }, []);
  const load = () => { (window as any).googleTranslateElementInit = () => new (window as any).google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
    const s = document.createElement("script"); s.id = "gt-s"; s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"; document.body.appendChild(s); };
  const pick = (l: string) => { localStorage.setItem("sc_lang", l); setLang(l); setCookie(l); location.reload(); };
  return <div className="notranslate flex items-center gap-2"><div id="google_translate_element" />
    <select aria-label="Language" value={lang} onChange={(e) => pick(e.target.value)} className={`inp !w-auto ${compact ? "!py-1 text-xs" : ""}`}>{LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
    {hint && lang === "en" && <button onClick={() => pick(hint)} className="chip chip-on">Translate to {LANGS.find((x) => x[0] === hint)?.[1]}?</button>}</div>;
}
