# SalesCrew — Capabilities

| Area | What works | Where |
|---|---|---|
| Vendors | Rise & Eat + **Print-Lab** (Ntianu Uzokwe, WA +234 802 993 6691, onyikute2002@gmail.com; mono/colour printing, flyers, banners, billboards, BSc/MSc/PhD binding). Team: Ntianu Uzokwe + Hilda Okoronkwo | `src/lib/schema.ts` (`printLab()`), migration in `src/lib/store.ts` |
| Leads | Centred, portalled modal (never clipped); live stage summary (20s visible-tab polling of `/api/stats`) | `/app/leads`, `src/components/ui.tsx` |
| Inbox | WhatsApp / Messenger / Instagram, manual or AI auto-reply, read receipts via webhooks, "waiting 15+ min" reminder banner, 24h-window insight, per-vendor sender handles, 10-row auto-grow composer | `/app/inbox`, `src/lib/meta.ts` |
| Products | Edit panel, Publish (FB/IG), Boost (copies caption → Ads Manager), Outreach (WhatsApp / **Instagram**) to interested leads, Teach AI (knowledge upload) | `/app/products`, `/app/outreach?channel=` |
| AI ops | Urgency insights, best send hour per vendor timezone, "replicate winning product tactics", campaign proposals → Approvals (approve / edit text / reject) → scheduled → published by cron | `src/lib/insights.ts`, `/api/insights`, Admin → Analytics / Autopilot |
| Admin | Neon SVG donuts, hourly bars, revenue line, product conversion bars, by-vendor cards; audit log with full timestamps, AI vs manual filter, search, CSV export | `src/app/app/admin/insights.tsx` |
| Vibe IDE | 3-pane builder, starter + follow-up pills, real multi-file generation, preview without COOP errors, version history + rollback, deploy to Vercel/Netlify/GitHub (one-time token or env), voice input | `/app/sites`, `src/lib/sitegen.ts` |

## Autonomous campaigns & cron
`vercel.json` runs `/api/cron` daily at 07:00 UTC (Hobby-plan limit). Each run: executes autopilot tasks (follow-ups, publish-due posts) and drafts **one** campaign proposal per active vendor (skipped if one is pending) timed to that vendor's audience peak in its own timezone. Nothing is posted until an owner approves it. For hourly precision, point an external scheduler (e.g. cron-job.org) at `GET /api/cron` with `Authorization: Bearer $CRON_SECRET`, or upgrade to Pro and change the schedule to `0 * * * *`.

## Environment keys (set in Vercel, never committed)
`META_*`/`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, page/IG tokens, `NVIDIA_API_KEY`, `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `CRON_SECRET`, optional `VERCEL_TOKEN` / `NETLIFY_TOKEN` / `GITHUB_TOKEN` for Vibe IDE deploys. Print-Lab's own WhatsApp number must be registered on the WhatsApp Cloud API (phone number ID) before it can send from its own number.
