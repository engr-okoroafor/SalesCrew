# SalesCrew — Capabilities

Multi-tenant, multi-vendor AI sales crew for small businesses. It runs on WhatsApp, Messenger, Instagram, email and voice.

## Pages
| Page | What it does |
|---|---|
| **Inbox** | Unified WhatsApp/Messenger/IG inbox with a 24-hour-window banner. Includes AI auto-reply with per-chat toggle, AI draft, media upload, test-customer simulation, lead side panel with Paystack/Stripe pay links and memory. |
| **Leads** | Pipeline stages, filters (B2B/B2C/segment/goods vs services/category). Multi-select bulk outreach/call/stage/delete. AI prospecting from an ICP. |
| **Products** | Goods and services catalog by category, with uploads and AI product photos. |
| **Outreach** | *Direct*: AI-personalised drafts with upsell, sent via WhatsApp or email. *Social*: Meta AI post studio (variants + image) to FB feed, IG feed, WA status/broadcast, FB groups and WA communities (share-link). Can schedule posts. |
| **Call Lab** | AI calls in English, Pidgin, Igbo, Yoruba and Hausa with live translation and TTS. Voice lab covers STT (Muse → HF whisper) and speech-to-speech (SeamlessM4T). Auto-books, fires CAPI and supports WhatsApp Calling when enabled. |
| **Bookings** | Month calendar coloured free/partial/full, with slot tooltips, day modal, booking/rescheduling and insights. |
| **CAPI** | Meta Conversions API dataset setup, automatic events (Lead/Contact/Schedule/InitiateCheckout/Purchase), test events, hashed payload viewer and log. |
| **Site builder** | Cursor-style IDE: chat with suggestion bubbles, Preview/Code toggle, web/mobile frames, file tree with right-click create/rename/duplicate/delete, tabs, editor (Tab, Ctrl+S). Themes: neon, web3, quantum, luxury, minimal. Features: WhatsApp/Messenger/IG/payments/auth/DB/booking/wallet. Deploys to Vercel, Netlify or GitHub (+ Actions CI), or downloads a .zip. Mobile adds a PWA manifest and Expo wrapper. |
| **Memory / NBA** | Short-term (72h) and long-term memory, plus AI next-best-actions linking to outreach/calls. |
| **Settings** | General (language, IP-based auto-translate), per-vendor Channels connect, AI, Calls, Payments, CAPI, Outreach, Notifications, Site, Health. |
| **Admin** | Analytics (funnel, vendor, channel, ROI), vendors CRUD, facilities, team/roles, campaigns, routing rules, payments audit, audit log. |

## Platform
- **AI**: Meta muse-spark is primary; NVIDIA NIM is the fallback, then an offline template. All routes report provider/fallback.
- **DB**: Neon Postgres if `DATABASE_URL` is set, otherwise Vercel Blob (`salescrew-data`), otherwise a local file. There is one JSON document per workspace plus `_global` (users, workspaces, channel routes).
- **Auth**: free email+password (scrypt) with HMAC cookie. Guests get the `demo` workspace.
- **Payments**: Paystack (NGN) and Stripe (USD) with signed webhooks. A paid webhook moves the lead to the paid stage, fires CAPI Purchase and saves nurture memory.
- **Language**: en-US by default. Detected via IP (`/api/geo`); full-page Google Translate with 19 languages.
- **Cron**: `vercel.json` runs a daily job for scheduled posts, memory expiry and stale-lead flags.

## Multi-vendor channel connect
1. Settings → Channels → choose vendor → **Connect with Facebook**. Facebook Login for Business requests Pages, Messaging, IG and WhatsApp scopes; the HMAC-signed state is `workspace.vendor`.
2. `/api/channels/callback` exchanges the code for a long-lived token. It then reads `me/accounts` (Page tokens + linked IG business id) and `me/businesses` → WABA phone numbers, and stores the tokens server-side on the vendor (never returned to the browser). It registers `routes[channelId] = {workspace, vendor}` and subscribes the app to the Page/WABA webhooks.
3. Manual alternative: paste Phone Number ID / Page ID / **IG_USER_ID** plus a token.
4. `/api/webhooks/meta` receives a message and looks up the route by phone_number_id / page id / IG id to find workspace+vendor. It then upserts the lead and conversation, runs AI auto-reply with vendor persona+memory, and sends using that vendor's token. Bookings and CAPI fire as a side effect. Routing rules can reassign.
