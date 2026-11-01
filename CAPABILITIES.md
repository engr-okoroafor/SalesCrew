# SalesCrew — Capabilities
Multi-tenant, multi-vendor AI sales crew for small businesses. It runs on WhatsApp, Messenger, Instagram, email and voice.
## Pages
| Page | What it does |
|---|---|
| **Inbox** | Unified WhatsApp/Messenger/IG inbox with a 24-hour-window banner, per-chat AI auto-reply toggle, AI draft (uses the vendor knowledge base), media upload, test-customer simulation, lead side panel with Paystack/Stripe/bank-transfer pay links. |
| **Leads** | Pipeline stages and filters, 50-per-page animated pager, lead source and multi-channel icons, industry-aware placeholders, bulk outreach/stage/delete, call button → Engage call mode, AI prospecting from an ICP. |
| **Products** | Goods/services catalog with image/video carousel, per-product analytics (views, inquiries, conversions via the public `/api/track` beacon used by generated sites), uploads and AI product photos. |
| **Engage** (`/app/outreach`) | *Reach out*: text or AI call mode; channel “auto” uses the lead's latest chat channel (WhatsApp/Messenger/IG/email); languages en, Pidgin, Igbo, Yoruba, Hausa; call transcript + browser TTS. *Engagers*: everyone who liked/commented/messaged — AI draft, public reply, private DM, ignore, “Auto-reach all new”. *Social*: Meta AI post studio and scheduler. (Former Call Lab is merged here; `/app/calls` redirects.) |
| **Bookings** | Month calendar coloured free/partial/full, with slot tooltips, day modal, booking/rescheduling and insights. |
| **CAPI** | Simplified: status banner (connected / dry-run), automatic event chips, live log; dataset/test-event settings under “Advanced”. |
| **Site builder** | IDE-style builder: chat shows the agent trajectory (read → plan → edit → validate) with a **self-heal** loop that validates HTML/CSS/JS/JSON and retries or reverts; Stop/continue (AbortController); context-aware neon suggestion scroller; remembered project facts; version history with one-click restore; voice input and photo attachments; desktop/tablet/mobile device previews; file tree with cursor-positioned context menu, tabs, status bar. Deploys to Vercel/Netlify/GitHub (+ Actions CI) or .zip, with a deploy helper that explains which server env token is missing (tokens never reach the browser). |
| **Settings** | General (language, IP-based auto-translate), per-vendor Channels connect, AI, Calls, Payments, CAPI, Outreach, Notifications, Site, Health. |
| **Admin** | **AI copilot** (natural-language ops: ask questions, get suggestions, queue actions), **Autopilot** (scheduled tasks + human-in-the-loop approvals), **Knowledge** (type/paste or upload photos, PDF, Word .docx — extracted to text and used by every AI reply), **Channels** (one unique WhatsApp number / Page / IG account per vendor, duplicates rejected), **Bank** accounts for transfer payments, analytics, vendors, facilities, team, campaigns, routing, payments audit with “Confirm received”, audit log. |

## Platform
- **AI**: Meta muse-spark is primary; NVIDIA NIM is the fallback, then an offline template. All routes report provider/fallback.
- **DB**: Neon Postgres if `DATABASE_URL` is set, otherwise Vercel Blob (`salescrew-data`), otherwise a local file. There is one JSON document per workspace plus `_global` (users, workspaces, channel routes).
- **Auth**: free email+password (scrypt) with HMAC cookie. Guests get the `demo` workspace.
- **Payments**: Paystack (NGN) and Stripe (USD) with signed webhooks. A paid webhook moves the lead to the paid stage, fires CAPI Purchase and saves nurture memory.
- **Language**: en-US by default. Detected via IP (`/api/geo`); full-page Google Translate with 19 languages.
- **Payments**: also bank transfer / cash — public `/pay/[ref]` page shows the vendor's bank accounts or a Paystack/Stripe button; admins confirm transfers in Admin → Payments.
- **Autopilot + cron**: `vercel.json` cron (daily 07:00 UTC / 08:00 WAT) calls `/api/cron`, which runs due tasks for every workspace: stale-lead follow-ups, payment reminders, reactivation, auto-engage commenters, publish scheduled posts, daily digest and custom AI tasks. Tasks with “Needs approval” queue drafts in Admin → Autopilot (approve / edit / reject); others execute directly. Without Meta tokens, sends are dry-run and logged.

## Multi-vendor channel connect
1. Settings → Channels → choose vendor → **Connect with Facebook**. Facebook Login for Business requests Pages, Messaging, IG and WhatsApp scopes; the HMAC-signed state is `workspace.vendor`.
2. `/api/channels/callback` exchanges the code for a long-lived token. It then reads `me/accounts` (Page tokens + linked IG business id) and `me/businesses` → WABA phone numbers, and stores the tokens server-side on the vendor (never returned to the browser). It registers `routes[channelId] = {workspace, vendor}` and subscribes the app to the Page/WABA webhooks.
3. Manual alternative: paste Phone Number ID / Page ID / **IG_USER_ID** plus a token.
4. `/api/webhooks/meta` receives a message and looks up the route by phone_number_id / page id / IG id to find workspace+vendor. It then upserts the lead and conversation, runs AI auto-reply with vendor persona+memory, and sends using that vendor's token. Bookings and CAPI fire as a side effect. Routing rules can reassign.
