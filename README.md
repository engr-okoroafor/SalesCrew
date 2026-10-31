# SalesCrew — an AI sales crew for small businesses

**Meta Global AI Developer Hackathon 2026 · Indie Dev Track · Theme: Build for Your World**
Built by **Hilda Okoronkwo** ([@hildanonyelum-cell](https://github.com/hildanonyelum-cell)) — Port Harcourt, Rivers State, Nigeria.

SalesCrew finds prospects, cleans the data, writes the outreach, calls the ones who reply (in their language), books the meeting, answers WhatsApp / Messenger / Instagram DMs on its own, sends results back to Meta, and builds the one-page site that closes the deal.

Demo business: **Amaka's Oven & Events**, a bakery + catering business in Port Harcourt (seed data, no setup needed).

## What the demo shows (`/demo`)
| Tab | What happens | API |
|---|---|---|
| Inbox | WhatsApp, Messenger, IG DM threads. Agent replies **only to inbound threads**, stays on the business's services, offers two slots, books one, confirms. `HUMAN` or off-topic → human handoff | `/api/assist`, `/api/booking` |
| Leads | FB/IG Lead Ads + Page activity + Google + Maps + directories → de-duplicated, normalised (+234), scored list | `/api/leads` |
| Outreach | Enrichment → Muse Spark email that references a real detail about the prospect (owner approves before sending) | `/api/outreach` |
| Call lab | Diarized, code-switched (English↔Yoruba) transcript in Muse Voice Transcribe shape + translation into Yoruba/Igbo/Hausa/Pidgin/French (SeamlessM4T S2ST pipeline, simulated audio) | `/api/speech` |
| Bookings | Calendar; "job won" fires a CAPI event | `/api/booking` |
| CAPI | `meeting_booked` → `Schedule`, `job_won` → `Purchase` payloads with SHA-256 hashed PII; dry-run unless `META_PIXEL_ID` + `META_CAPI_TOKEN` set | `/api/capi` |
| Site builder | Muse Code-style one-page site generated from Page posts, reviews and photos, previewed in a sandboxed iframe | `/api/site` |
| Settings | Provider order toggle + live connection test | `/api/health?ping=meta` |

## Models
- **Primary:** Meta Model API — `muse-spark-1.3` (OpenAI-compatible `https://api.meta.ai/v1/chat/completions`)
- **Fallback:** NVIDIA NIM — `nvidia/nemotron-3.5-super-vl-120b-a12b`
- Speech pipeline (designed for): `muse-voice-transcribe-1.0` (ASR, diarization, code-switching) + SeamlessM4T v2 (speech-to-speech)

The harness (`src/lib/ai.ts`) tries Meta first, falls back to NVIDIA on error/timeout/empty output, and finally to a scripted demo reply so the demo never dead-ends. Every response is tagged with provider + model in the UI.

## Meta platform compliance
- Replies only to people who message the business first (inside the customer-service window)
- Task-specific: prices, availability, bookings, order status, delivery, rescheduling — no open-ended assistant chat
- Off-topic → polite refusal + handoff; `HUMAN` pauses the agent on that thread
- Outbound email drafts are owner-approved

## Run locally
```bash
cp .env.example .env.local   # add MODEL_API_KEY and (optional) NVIDIA_API_KEY
npm install && npm run dev   # http://localhost:3000
```
Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Framer Motion. Deployed on Vercel.

## License
MIT © 2026 Hilda Okoronkwo
