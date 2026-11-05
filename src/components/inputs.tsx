"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type TextareaHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
// Auto-growing textarea: grows with content from `minRows` up to `maxRows` (default 10), then scrolls.
export const AutoGrow = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number; maxRows?: number }>(function AutoGrow({ minRows = 1, maxRows = 10, style, className = "", ...p }, ref) {
  const el = useRef<HTMLTextAreaElement>(null); useImperativeHandle(ref, () => el.current!);
  const fit = useCallback(() => { const t = el.current; if (!t) return; const cs = getComputedStyle(t); const lh = parseFloat(cs.lineHeight) || 20; const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    t.style.height = "auto"; const max = lh * maxRows + pad; const min = lh * minRows + pad; t.style.height = `${Math.max(min, Math.min(t.scrollHeight, max))}px`; t.style.overflowY = t.scrollHeight > max ? "auto" : "hidden"; }, [minRows, maxRows]);
  useLayoutEffect(fit, [p.value, fit]); useEffect(() => { addEventListener("resize", fit); return () => removeEventListener("resize", fit); }, [fit]);
  return <textarea ref={el} rows={minRows} {...p} onInput={(e) => { fit(); p.onInput?.(e); }} className={`resize-none scroll-thin ${className}`} style={{ lineHeight: "20px", ...style }} />;
});
// Tooltip that is measured and clamped inside the viewport on all four edges (flips above/below as needed).
export function EdgeTip({ text, children, maxW = 360 }: { text: ReactNode; children: ReactNode; maxW?: number }) {
  const host = useRef<HTMLSpanElement>(null); const tip = useRef<HTMLDivElement>(null); const [r, setR] = useState<DOMRect | null>(null); const [pos, setPos] = useState<{ l: number; t: number } | null>(null);
  useLayoutEffect(() => { if (!r || !tip.current) return; const b = tip.current.getBoundingClientRect(); const m = 8; let l = r.left + r.width / 2 - b.width / 2; l = Math.max(m, Math.min(l, innerWidth - b.width - m));
    let t = r.top - b.height - 8; if (t < m) t = r.bottom + 8; if (t + b.height > innerHeight - m) t = Math.max(m, innerHeight - b.height - m); setPos({ l, t }); }, [r]);
  return <span ref={host} className="inline-flex" onMouseEnter={() => { setPos(null); setR(host.current!.getBoundingClientRect()); }} onMouseLeave={() => setR(null)} onFocus={() => setR(host.current!.getBoundingClientRect())} onBlur={() => setR(null)}>{children}
    {r && typeof document !== "undefined" && createPortal(<div ref={tip} role="tooltip" style={{ position: "fixed", left: pos?.l ?? -9999, top: pos?.t ?? -9999, maxWidth: Math.min(maxW, innerWidth - 16), maxHeight: innerHeight - 16, zIndex: 10000 }}
      className="pointer-events-none overflow-hidden whitespace-pre-wrap rounded-xl border border-[#22d3ee]/40 bg-[#050b10]/95 px-3 py-2 text-xs leading-relaxed text-[#d8ffe9] shadow-[0_0_30px_-8px_#22d3ee] backdrop-blur">{text}</div>, document.body)}</span>;
}
// Cross-browser voice input: Web Speech API (Chrome, Edge, Safari) → MediaRecorder + /api/speech fallback (Firefox & others).
export function useVoice(onText: (t: string) => void, lang = "en-NG") {
  const [listening, setListening] = useState(false); const stopRef = useRef<() => void>(() => {}); const muse = useRef(false);
  useEffect(() => { fetch("/api/speech").then((r) => r.json()).then((j) => { muse.current = !!j.muse; }).catch(() => {}); }, []);
  const start = async () => {
    if (listening) { stopRef.current(); return; }
    const W = window as unknown as Record<string, unknown>; const SR = (W.SpeechRecognition || W.webkitSpeechRecognition) as (new () => { lang: string; interimResults: boolean; continuous: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void; onend: () => void; onerror: (e: { error: string }) => void; start: () => void; stop: () => void }) | undefined;
    const browser = () => { if (!SR) return false; try { const r = new SR(); r.lang = lang; r.interimResults = false; r.continuous = false; r.onresult = (e) => onText(Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ")); r.onend = () => setListening(false); r.onerror = () => setListening(false); stopRef.current = () => r.stop(); setListening(true); r.start(); return true; } catch { return false; } };
    if (!muse.current && browser()) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { dispatchEvent(new CustomEvent("sc-toast", { detail: "This browser blocks microphone access — type instead." })); return; }
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const mime = ["audio/webm", "audio/ogg", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported?.(m)) ?? ""; const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data); rec.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); setListening(false); const f = new FormData(); f.append("audio", new Blob(chunks, { type: mime || "audio/webm" }), "voice"); f.append("lang", lang.slice(0, 2));
        try { const j = await fetch("/api/speech", { method: "POST", body: f }).then((r) => r.json()); const t = (j.segments ?? []).map((s: { text: string }) => s.text).join(" ").trim(); if (t) onText(t); else dispatchEvent(new CustomEvent("sc-toast", { detail: j.note ?? "Couldn't transcribe — try again." })); } catch { dispatchEvent(new CustomEvent("sc-toast", { detail: "Transcription failed" })); } };
      stopRef.current = () => rec.state !== "inactive" && rec.stop(); setListening(true); rec.start(); setTimeout(() => stopRef.current(), 15000); dispatchEvent(new CustomEvent("sc-toast", { detail: "Recording… tap the mic again to finish" })); }
    catch { setListening(false); dispatchEvent(new CustomEvent("sc-toast", { detail: "Microphone permission denied" })); }
  };
  return { listening, start };
}
