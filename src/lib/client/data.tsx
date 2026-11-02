"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Workspace, CollName } from "@/lib/schema";
type Session = { uid: string; ws: string; name: string; email: string; role: string } | null;
type Ctx = { w: Workspace | null; backend: string; session: Session; vendor: string; setVendor: (v: string) => void; refresh: () => Promise<void>; set: (w: Partial<Workspace>) => void;
  save: (coll: CollName, item: unknown) => Promise<void>; saveMany: (coll: CollName, items: unknown[]) => Promise<void>; del: (coll: CollName, ids: string[]) => Promise<void>; settings: (s: Partial<Workspace["settings"]>) => Promise<void>; api: <T = any>(path: string, body?: unknown) => Promise<T> };
const C = createContext<Ctx>(null as never);
export const useData = () => useContext(C);
export async function api<T = any>(path: string, body?: unknown): Promise<T> { const r = await fetch(path, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json(); }
export function DataProvider({ children }: { children: ReactNode }) {
  const [w, setW] = useState<Workspace | null>(null); const [backend, setB] = useState(""); const [session, setS] = useState<Session>(null); const [vendor, setVendor] = useState("all");
  const refresh = useCallback(async () => { const j = await api("/api/db"); setW(j.workspace); setB(j.backend); setS(j.session); }, []);
  useEffect(() => { refresh(); const v = localStorage.getItem("sc_vendor"); if (v) setVendor(v); }, [refresh]);
  useEffect(() => { localStorage.setItem("sc_vendor", vendor); }, [vendor]);
  // Light live sync: poll the ~300-byte /api/stats only while visible (20s), plus on focus; refetch the workspace only when its version changed.
  useEffect(() => { let last = ""; const tick = async () => { if (document.hidden) return; try { const j = await api("/api/stats"); if (last && j.v && j.v !== last) await refresh(); last = j.v ?? last; } catch { /* offline */ } };
    tick(); const t = setInterval(tick, 20000); addEventListener("focus", tick); document.addEventListener("visibilitychange", tick); return () => { clearInterval(t); removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); }; }, [refresh]);
  const post = async (b: unknown) => { const j = await api("/api/db", b); if (j.workspace) setW(j.workspace); };
  return <C.Provider value={{ w, backend, session, vendor, setVendor, refresh, set: (p) => setW((o) => (o ? { ...o, ...p } : o)), api,
    save: (coll, item) => post({ op: "upsert", coll, item }), saveMany: (coll, items) => post({ op: "upsert", coll, items }), del: (coll, ids) => post({ op: "delete", coll, ids }), settings: (s) => post({ op: "settings", settings: s }) }}>{children}</C.Provider>;
}
export const inVendor = (vendor: string) => (x: { vendorId: string }) => vendor === "all" || x.vendorId === vendor;
export async function upload(files: FileList | File[]) { const f = new FormData(); Array.from(files).forEach((x) => f.append("file", x)); const r = await fetch("/api/upload", { method: "POST", body: f }); return (await r.json()).files as { url: string; type: "image" | "video"; name: string }[]; }
