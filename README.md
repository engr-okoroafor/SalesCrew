# SalesCrew — an AI sales crew for small businesses

**Meta Global AI Developer Hackathon 2026 · Indie Dev Track · Theme: Build for Your World**
Built by **Hilda Okoronkwo** ([@hildanonyelum-cell](https://github.com/hildanonyelum-cell)) — Port Harcourt, Rivers State, Nigeria.

SalesCrew finds prospects, cleans the data, writes the outreach, calls the ones who reply (in their language), books the meeting, answers WhatsApp / Messenger / Instagram DMs on its own, sends results back to Meta, and builds the one-page site that closes the deal.

Demo business: **Rise & Eat**, a bakery + catering business in Port Harcourt (seed data, no setup needed).

## App (`/app`)
Inbox → Leads → Products → Outreach → Call Lab → Bookings → CAPI → Site builder → Memory/NBA → Settings → Admin. The app is multi-tenant: each vendor connects its own WhatsApp, Facebook Page and Instagram account. See **[CAPABILITIES.md](CAPABILITIES.md)** for the full feature list, data store and channel-connect flow. All environment variables are in **[.env.example](.env.example)**.

- Open `/app/inbox` to use the guest demo workspace.
- Use `/login` to sign up or sign in. It creates a free, persistent workspace stored in Neon or Vercel Blob.

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
