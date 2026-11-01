// IP-based language suggestion. Vercel adds x-vercel-ip-country; default en-US.
const MAP: Record<string, string> = { NG: "en-NG", US: "en-US", GB: "en-GB", FR: "fr", DE: "de", ES: "es", MX: "es", BR: "pt", PT: "pt", CN: "zh", JP: "ja", KR: "ko", IN: "hi", SA: "ar", AE: "ar", EG: "ar", RU: "ru", IT: "it", TR: "tr", KE: "sw", TZ: "sw", GH: "en", ZA: "en", NL: "nl", ID: "id" };
export async function GET(req: Request) { const c = req.headers.get("x-vercel-ip-country") ?? ""; const al = req.headers.get("accept-language")?.split(",")[0] ?? "en-US";
  return Response.json({ country: c || null, suggested: MAP[c] ?? (al.startsWith("en") ? "en-US" : al.split("-")[0]), acceptLanguage: al }); }
