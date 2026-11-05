// Document → text for the vendor knowledge base. TXT/MD/CSV/JSON native, DOCX via jszip (word/document.xml), PDF via unpdf, images via AI vision (Meta / NVIDIA VL).
import JSZip from "jszip";
import { vision } from "@/lib/ai";
export async function extractText(name: string, type: string, buf: ArrayBuffer): Promise<{ text: string; via: string }> {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (type.startsWith("text/") || ["txt", "md", "csv", "json"].includes(ext)) return { text: new TextDecoder().decode(buf), via: "text" };
  if (ext === "docx" || type.includes("wordprocessingml")) { const z = await JSZip.loadAsync(buf); const xml = (await z.file("word/document.xml")?.async("string")) ?? "";
    return { text: xml.replace(/<w:tab\/>/g, "\t").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{3,}/g, "\n\n").trim(), via: "docx" }; }
  if (ext === "pdf" || type === "application/pdf") { try { const { extractText: ex, getDocumentProxy } = await import("unpdf"); const pdf = await getDocumentProxy(new Uint8Array(buf)); const { text } = await ex(pdf, { mergePages: true }); return { text: String(text).trim(), via: "pdf" }; } catch (e) { return { text: "", via: `pdf-failed: ${(e as Error).message}` }; } }
  if (type.startsWith("image/")) { const r = await vision("Extract ALL useful business knowledge from this image for a sales assistant: products, prices, menus, opening hours, policies, contact details. Return clean plain text, lists where natural.", `data:${type};base64,${Buffer.from(buf).toString("base64")}`);
    return { text: r.text, via: r.text ? `vision:${r.provider}` : "vision-unavailable (set MODEL_API_KEY or NVIDIA_API_KEY)" }; }
  if (ext === "doc") return { text: "", via: "legacy .doc not supported — save as .docx or PDF" };
  return { text: "", via: "unsupported" };
}
