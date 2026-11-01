# SalesCrew — Meta Global AI Developer Hackathon 2026
**Track:** Indie Dev · **Theme:** Build for Your World

**Tagline:** *Your AI sales team that lives in WhatsApp, Messenger and Instagram.*

**Elevator pitch:** SalesCrew gives every small vendor (bakers, caterers, event planners, boutiques) an AI sales crew powered by Meta AI. It answers DMs on WhatsApp, Messenger and Instagram in the customer's language, qualifies leads, books orders, takes payment in NGN (Paystack) or USD (Stripe), and reports every conversion back to Meta through the Conversions API. A vendor can be live in minutes and connects its own channels.

- Live: https://salescrew.vercel.app
- Code: https://github.com/hildanonyelum-cell/SalesCrew
- Team: Chukwudifu Uzoma Okoroafor (engineering, product) · Hilda Okoronkwo (product, go-to-market, repo owner)

## Problem
Across Nigeria and much of the Global South, commerce happens in chat. Vendors lose sales because they can't reply fast enough at 2am. They juggle three apps and switch between English, Pidgin, Igbo, Yoruba and Hausa. They also can't afford a CRM, an ads analyst or a developer. Ads on Meta bring traffic, but conversions that close in WhatsApp are never reported back, so ad spend is wasted.

## Solution
A single neon-glass workspace where an AI agent:
1. **Replies instantly** on WhatsApp Cloud API, Messenger and IG DMs (unified inbox), in the customer's language.
2. **Qualifies and remembers**: lead scoring, memory bank, and a next-best action for each contact.
3. **Closes**: bookings, product catalog, and payment links (Paystack NGN / Stripe USD).
4. **Measures**: lead, contact, checkout and purchase events go to Meta CAPI so ads optimise on real sales.
5. **Grows**: outreach campaigns, a daily follow-up cron, and an AI site builder (IDE plus deploy to Vercel, Netlify, GitHub or ZIP).

## How it uses Meta
| Meta surface | Use |
|---|---|
| Meta AI (Llama / muse-spark) | Primary LLM for replies, lead scoring, site generation; NVIDIA NIM fallback, then offline |
| WhatsApp Cloud API | Inbound webhook, outbound replies and templates, per-vendor phone number |
| Messenger Platform | Page inbox via webhook and Send API |
| Instagram Messaging | IG DMs through the linked IG business account |
| Conversions API | Server-side Lead / Contact / InitiateCheckout / Purchase with hashed user data; test-event console |
| Facebook Login (OAuth) | Each vendor connects its own Page, IG and WABA; tokens stay server-side only |
| SeamlessM4T / Muse voice | Speech translation hooks for voice notes (endpoint configurable) |

## Demo script (3 min)
1. 0:00 Landing page: the hook ("Vendors lose 60% of chats after hours").
2. 0:20 Sign up and create a vendor workspace. Settings → Channels → Connect with Facebook (WA/FB/IG).
3. 0:50 Send a WhatsApp message in Pidgin ("Abeg how much for 3-tier cake?"). The AI replies in Pidgin with price and photo.
4. 1:20 Inbox shows the same thread; the lead is auto-scored; Memory shows the next-best action.
5. 1:45 Customer books. A Paystack link is sent, payment completes, and the booking is confirmed.
6. 2:10 CAPI page: the Purchase event appears in the log and the payload viewer.
7. 2:30 Sites: "Build me a cake shop site". Preview, then deploy to Vercel.
8. 2:50 Admin: multi-vendor analytics. Close with the tagline.

## Why we win
- **Built for our world**: chat-first commerce, local currencies, IP-based language detection, full-page translate.
- **Deep Meta integration**: AI, WhatsApp, Messenger, IG, CAPI and Login in one closed loop from message to measured sale.
- **Multi-vendor by design**: each vendor brings its own channels. This is a platform, not a demo bot.
- **Resilient**: Meta AI → NVIDIA → offline fallback, and a free persistent store (Neon / Vercel Blob).
- **Shipped**: live in production on Vercel, with free-tier infrastructure an indie developer can sustain.

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
