> Full hackathon pack: [docs/submission/README.md](docs/submission/README.md) · Word version: `docs/submission/SalesCrew-Submission.docx`
> **Live (no setup, click-through demo):** https://salescrew.vercel.app · **Repo:** https://github.com/hildanonyelum-cell/SalesCrew

# SalesCrew — paste-ready submission answers
*Meta Global AI Developer Hackathon 2026 · Indie Dev Track · Build for Your World*

**Team Name:** SalesCrew

**Team Members:** Hilda Okoronkwo (hildanonyelum) — repo owner, product & go-to-market · Ntianu Uzokwe (onyikute2002@gmail.com) — Print-Lab founder, operations & vendor success

**Track:** Indie Dev Track

**Problem statement:** Build for Your World

**Most Viral Track X post:** https://x.com/SalesCrewAI/status/2117274494620586246

**Project Description:**
In Port Harcourt, business happens in the DMs. A bakery like Rise & Eat gets "Abeg how much for 3-tier cake? I need am Saturday" on WhatsApp at 11:40pm, a price question on Instagram, and a wedding enquiry on Messenger — and the owner is asleep, baking, or stuck in traffic on Aba Road. By morning that customer has bought from someone who answered. Every missed reply is a lost sale, and hiring night staff, a call centre or a marketing agency is out of reach for most Nigerian SMBs.

SalesCrew is an AI sales crew built on Meta AI that answers those messages for the business. It replies on WhatsApp, Messenger and Instagram in the customer's own language (English, Pidgin, Yoruba, Igbo, Hausa), quotes from the owner's real price list, offers real open slots, books the order, sends a Paystack/Stripe/bank-transfer pay link, and reports the booking and purchase back to Meta through the Conversions API, so the owner's ads optimise for paying customers instead of likes.

It is deliberately scoped to stay on the right side of Meta's 2026 messaging rules: it only replies to people who messaged first, it only talks about the business's own products, orders, delivery and bookings, a rule-based scope guard blocks off-topic requests before the model is even called, and typing "HUMAN" (or anything out of scope) hands the thread straight to the owner. It is a task-specific customer-service and booking agent, not a general chatbot.

Around that agent sits the rest of a small sales team: lead capture from Lead Ads and Page activity, de-duplicated and scored; Engage, which drafts replies or AI voice calls to everyone who commented or liked a post; Autopilot, which runs follow-ups and payment reminders on a schedule but waits for one-click owner approval (human in the loop); and a Muse Code-style site builder that turns the business's photos, menu and reviews into a deployable one-page website.

It works today: the live demo at salescrew.vercel.app runs the full pipeline on Rise & Eat, a Port Harcourt bakery, with no login needed, and any vendor can sign up and connect their own WhatsApp number, Page and Instagram account.

**Public GitHub Repository:** https://github.com/hildanonyelum-cell/SalesCrew

**3-Minute Demo Video:** https://youtu.be/3Wcyvw9igrM (Unlisted, ~2:59 — autonomous campaigns, realtime bot replies, history-aware AI drafts)

**Describe your use of Meta products to build the submitted project:**
- **Muse Spark 1.3 (`muse-spark-1.3`) via Meta Model API — the brain.** Every reasoning path runs on it first: the scoped WhatsApp/Messenger/IG booking agent, Pidgin and code-switched replies grounded in the vendor's uploaded knowledge base (menu photos, PDF price lists, Word policies), lead scoring and next-best action, Engage reply drafts, the Admin copilot that answers "who should I follow up today?", Autopilot tasks, and site generation. Called through the OpenAI-compatible `/v1/chat/completions` with `reasoning_effort: low` so a DM gets a reply in seconds.
- **Booking-token protocol on Muse Spark.** The model may only commit to a slot by emitting a booking token that the server validates against the real calendar; a hallucinated time can never become a booking.
- **Muse Voice Transcribe (`muse-voice-transcribe-1.0`).** ASR for voice notes and sales calls, chosen for speaker diarization and English↔Yoruba/Pidgin code-switching — the way people in Port Harcourt actually talk.
- **SeamlessM4T (Meta open model).** Speech-to-speech translation so an Igbo-speaking caterer and a Hausa-speaking client each hear the other in their own language.
- **Muse Code pattern.** Page content → one-page website, with a self-heal loop (read → plan → edit → validate → retry/revert), version history and one-click deploy. Muse Code also helped us write parts of SalesCrew itself.
- **WhatsApp Cloud API, Messenger Platform, Instagram Messaging.** One webhook (`/api/webhooks/meta`) routes each inbound message to the right vendor by phone-number ID / Page ID / IG ID; replies go out with that vendor's own token. Inbound-only, 24-hour-window aware, HUMAN handoff in every thread.
- **Facebook Login for Business.** Each vendor connects its own WABA number, Page and IG account in one click; tokens are stored server-side only and duplicate channels are rejected.
- **Lead Ads + Page activity** as lead sources; **Conversions API** sends `Lead`, `Schedule`, `InitiateCheckout` and `Purchase` events with SHA-256 hashed PII, fired automatically when a booking is made or a payment webhook lands — closing the loop from ad → DM → payment → ad optimisation.

**Why are Meta's models important to your solution?**
Because my customers' customers already live on Meta. In Nigeria, WhatsApp is the shop counter, Instagram is the shop window and Facebook is the notice board. Meta's models let one agent understand those conversations as they really happen — Nigerian English, Pidgin, and Yoruba or Igbo switched mid-sentence — and act inside the same apps the conversation started in, then feed real sales back into Meta Ads. Muse Spark is fast and cheap enough to answer every single DM within seconds on a small-business budget, and it holds a tight business scope reliably, which is exactly what a compliant customer-facing agent needs. Muse Voice Transcribe and SeamlessM4T let a Port Harcourt bakery talk to a customer in their own language, something no off-the-shelf CRM offers. Without Meta's models SalesCrew would be an English-only FAQ bot; with them it is a multilingual sales team that never sleeps.

**Feedback from your experience using partner technologies:**
I used NVIDIA NIM (Nemotron) as an automatic fallback behind Meta Model API, then an offline template so a customer never gets silence; every route reports which provider answered. Vercel hosts the app, cron (Autopilot) and Blob storage, with Neon Postgres optional. Because both inference APIs are OpenAI-compatible, the two-provider harness was about 40 lines. Wishes: clearer published rate limits, a shared health/status endpoint across inference partners to make fallback decisions smarter, and more Nigerian-language speech samples in the docs.

**How likely are you to build with Meta Model API?** Very likely (5/5)

**Overall opinion of Meta Model API:** Very positive. Fast, OpenAI-compatible, a drop-in for existing code, and Muse Spark follows scoped system prompts well. One tip for others: reasoning tokens count against `max_tokens`, so budget for them — once I did, replies were consistent.

**How likely to recommend Meta Model API to another developer:** 9/10

**How likely to recommend Muse Code:** 9/10

**Biggest obstacle:**
Making an autonomous messaging agent genuinely useful without crossing Meta's 2026 rules against open-ended assistant chat. I solved it with three layered controls: (1) a hard inbound-only rule — SalesCrew never starts a conversation; (2) a rule-based scope guard that refuses off-topic requests and hands off to a human before the model is called; (3) the booking-token protocol, so the agent can only commit to real calendar slots. Autopilot adds a fourth: anything proactive (follow-ups, reminders) waits for owner approval. The second obstacle was time: WhatsApp Business API approvals and live telephony take longer than the hackathon window, so the public demo runs those channels in a simulator that uses the exact same agent, webhook and API contracts as production, while real vendors can already connect their own channels via Facebook Login.

**Meta's models vs other models you've used:**
Muse Spark 1.3 matched or beat the NVIDIA Nemotron fallback on instruction-following for the scoped booking agent, was more natural writing Nigerian-English and Pidgin customer replies, and was stronger on the Yoruba translation step. Nemotron was slightly faster on very short prompts, which is why it stays as the fallback rather than the primary. For this project, Meta's models were the better fit.

**What matters most when choosing an AI model or coding tool:** Quality / accuracy

**Please specify:**
Reliable instruction-following inside a strict scope (a customer-facing agent must never go off-policy), multilingual and code-switching ability for African languages, chat latency under ~3 seconds, a price per token a small business can afford, and OpenAI-compatible APIs so I can keep a fallback provider.

**What makes it hardest to switch:**
Prompt and guardrail tuning. Each model reacts differently to the same scope rules and booking-token protocol, so switching means re-testing every policy edge case. Speech features like diarization and code-switching also aren't equivalent across providers.

**What would most likely stop you from using Meta's models in production:**
Regional availability, pricing and rate-limit guarantees for Africa-based businesses, plus clear data-residency and retention terms for customer conversations. Published SLAs and pricing would remove that blocker.

---
**Impact in one line (for description field if space allows):** A Port Harcourt vendor who loses even 3 after-hours orders a week at ~₦25,000 each is leaving roughly ₦300,000/month on the table; SalesCrew answers those chats instantly and replaces the night-shift staff, call centre and agency retainers a small business could never afford — on free-tier infrastructure. *(Illustrative estimate, not a measured result.)*

**Feature summary:** Unified WhatsApp/Messenger/IG inbox with AI replies grounded in an uploaded knowledge base (photos, PDF, Word) · scope guard + HUMAN handoff · booking calendar with token-validated slots · Engage: text or AI voice calls in English, Pidgin, Igbo, Yoruba, Hausa, plus replies/DMs to everyone who liked or commented · leads with source tracking and scoring · products with view/inquiry analytics · Paystack, Stripe or bank-transfer payments with a public pay page · Conversions API events · AI site builder with self-healing edits, versions, voice, attachments and one-click deploy · Admin AI copilot · Autopilot with human-in-the-loop approvals · one unique WhatsApp number / Page / IG account per vendor · Meta AI → NVIDIA → offline fallback.
