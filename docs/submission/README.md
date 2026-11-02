# SalesCrew — Meta Global AI Developer Hackathon 2026
**Track:** Indie Dev · **Theme:** Build for Your World

**Tagline:** *The sales team a Port Harcourt bakery could never afford — living inside WhatsApp, Messenger and Instagram, powered by Meta AI.*

**Elevator pitch:** SalesCrew gives every small vendor (bakers, caterers, event planners, boutiques) an AI sales crew built on **Muse Spark 1.3**. It answers inbound DMs on WhatsApp, Messenger and Instagram in the customer's language (English, Pidgin, Yoruba, Igbo, Hausa), quotes from the owner's real price list, books real slots, collects payment (Paystack NGN, Stripe USD or bank transfer) and reports every booking and sale back to Meta through the Conversions API. Scoped, inbound-only and with a HUMAN handoff in every thread. Live and working today.

- **Live (no login needed):** https://salescrew.vercel.app — demo brand **Rise & Eat**, Port Harcourt
- **Code:** https://github.com/hildanonyelum-cell/SalesCrew
- **Demo video (3 min):** TBD — YouTube link to be added
- **Team:** Hilda Okoronkwo (hildanonyelum — product, go-to-market, repo owner) · Ntianu Uzokwe (onyikute2002@gmail.com — Print-Lab, operations & vendor success)

## Problem — our world
In Nigeria, commerce happens in chat. Customers message at 11pm, in Pidgin or switching between English and Yoruba, across three different apps. Owners are baking, delivering or asleep, so replies come hours late and the customer buys elsewhere. Night staff, a call centre or a marketing agency costs more than most SMBs earn in a month. And when a Meta ad brings a customer who then pays inside WhatsApp, that sale is never reported back, so ad spend optimises for clicks instead of revenue.

## Impact (~30%)
- **Revenue:** instant replies 24/7 recover after-hours orders. Illustrative: 3 lost orders/week × ~₦25,000 ≈ **₦300,000/month** back for one bakery.
- **Cost savings:** replaces a night-shift sales rep, call-centre overflow and agency work (follow-ups, social replies, a website) with one workspace on free-tier infrastructure.
- **Better ads:** CAPI `Schedule`/`Purchase` events teach Meta Ads which audiences actually pay.
- **Inclusion:** five Nigerian languages, voice for customers who prefer voice notes, local currency and bank-transfer payments.
- **Scales:** multi-vendor by design — every vendor connects its own WhatsApp number, Page and IG account.
*(Figures are illustrative estimates, not measured results.)*

## Creative use of Meta AI (~25%)
| Meta technology | How SalesCrew uses it |
|---|---|
| **Muse Spark 1.3** (primary) | Scoped booking agent, knowledge-grounded Pidgin/code-switched replies, lead scoring, Engage drafts, Admin copilot, Autopilot tasks, site generation — `reasoning_effort: low` for seconds-fast DMs |
| **Booking-token protocol** | Muse Spark can only commit to a slot by emitting a token the server validates against the real calendar |
| **Muse Voice Transcribe** | Diarized ASR for voice notes and calls, English↔Yoruba/Pidgin code-switching |
| **SeamlessM4T** | Speech-to-speech translation so each side of a call hears their own language |
| **Muse Code pattern** | Page photos, menu and reviews → one-page site with a self-heal loop, versions and one-click deploy |
| **WhatsApp Cloud API / Messenger / IG Messaging** | One webhook routes each inbound message to the right vendor; replies sent with that vendor's token |
| **Facebook Login for Business** | One-click per-vendor channel connect; tokens server-side only |
| **Lead Ads + Page activity** | Lead sources, de-duplicated and scored |
| **Conversions API** | `Lead` / `Schedule` / `InitiateCheckout` / `Purchase` with SHA-256 hashed PII, fired automatically |

## Technical depth (~20%)
- **Scoped inbound-only agent:** rule-based scope guard runs *before* the model; HUMAN keyword handoff; 24-hour-window awareness — compliant with Meta's 2026 rules (task-specific service and booking, not open-ended chat).
- **Human-in-the-loop Autopilot:** Vercel cron runs follow-ups, payment reminders, reactivation and comment engagement; tasks marked "Needs approval" queue drafts for approve/edit/reject.
- **Multi-vendor channel routing:** `routes[channelId] → {workspace, vendor}`; duplicate numbers/Pages/IG accounts rejected.
- **Resilient inference:** Meta Model API → NVIDIA NIM (Nemotron) → offline template; every response reports provider and fallback.
- **Closed loop:** Paystack/Stripe signed webhooks → lead stage "paid" → CAPI Purchase → nurture memory.
- **Knowledge grounding:** photos, PDF and Word uploads extracted to text and injected into every reply.

## Does it work? Yes
The production deployment runs the whole pipeline on Rise & Eat with no setup: inbox, scoped replies, bookings calendar, pay page, CAPI log, Engage, Autopilot approvals and the site builder. Without Meta tokens, sends run in dry-run mode and are logged, using the same contracts as production; real vendors can connect live channels via Facebook Login.

## Demo script (3 min)
1. **0:00** Hook: an 11:40pm WhatsApp from a Port Harcourt customer — "Abeg how much for 3-tier cake? I need am Saturday."
2. **0:20** Muse Spark replies in Pidgin with the real price, offers two open slots, books one and sends a Paystack link.
3. **0:50** Customer asks something off-topic → scope guard declines; types HUMAN → thread handed to the owner.
4. **1:15** Payment lands → booking confirmed on the calendar → CAPI `Purchase` appears in the live log.
5. **1:40** Engage: AI drafts replies to everyone who commented on the latest post; Autopilot queues follow-ups for one-click approval.
6. **2:10** Admin copilot: "Who should I follow up today?" → drafts queued.
7. **2:30** Site builder: "Build Rise & Eat a one-page site" → self-heal → deploy.
8. **2:50** Settings → Channels: any vendor connects their own WhatsApp, Page and IG. Close on tagline.

## Why SalesCrew wins
- **Built for our world:** chat-first commerce, Pidgin and Nigerian languages, naira payments, bank transfer.
- **Deepest Meta loop:** Muse Spark + Voice Transcribe + SeamlessM4T + WhatsApp/Messenger/IG + Login + CAPI, from first DM to measured sale.
- **Compliant autonomy:** useful enough to run the business overnight, scoped enough to respect Meta's rules, with a human always one word away.
- **It works:** live in production, multi-vendor, with a resilient fallback chain — built by an indie team on free-tier infrastructure.

## Tech stack and architecture
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Framer Motion · Vercel Functions and Cron · Neon Postgres or Vercel Blob JSON store · scrypt + HMAC cookie auth · Graph API v21.0 · Paystack and Stripe webhooks.

```
WA / FB / IG ──webhook──► /api/webhooks/meta ──► agent (Meta AI → NVIDIA → offline)
                                   │                    │
                                   ▼                    ▼
                         store (per-workspace JSON)  reply via Graph Send API
                                   │
              bookings / pay (Paystack|Stripe) ──► /api/pay/webhook ──► CAPI Purchase
```
