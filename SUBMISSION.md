> Full hackathon submission pack: see [docs/submission/README.md](docs/submission/README.md) (also as PDF).
> Live: https://salescrew.vercel.app · Repo: https://github.com/hildanonyelum-cell/SalesCrew

# SalesCrew — paste-ready submission answers

**Team Name:** SalesCrew

**Team Members:** Hilda Okoronkwo (hildanonyelum)

**Track:** Indie Dev Track

**Problem statement:** Build for Your World

**Most Viral Track X post:** (optional — paste link if posted)

**Project Description:**
SalesCrew is an AI sales crew for small businesses. It finds prospects, cleans the data, writes the outreach, calls the people who reply in their own language, books the meeting, and builds the page that closes the deal.

It also runs the business's day-to-day messaging on WhatsApp, Facebook Messenger and Instagram DM. A customer messages at 11pm asking if a cake can be ready for Saturday. SalesCrew quotes the price, offers two open slots, books one and sends the confirmation, and the owner never has to touch it. This autonomy is scoped on purpose. SalesCrew only replies to people who messaged first. It stays on the business's own services and bookings. Every thread offers a human handoff, and typing "HUMAN" or asking anything off-topic hands the thread to the owner. That keeps it on the allowed side of Meta's 2026 messaging rules: task-specific customer service and booking, not open-ended assistant chat.

Outbound, SalesCrew pulls leads from Facebook/Instagram Lead Ads and Page activity, then from Google, maps and public directories. It merges them into one de-duplicated, scored list. Muse Spark writes an email that references something real about each prospect. When a prospect replies, the call runs through Muse Voice Transcribe (speaker labels, English↔Yoruba code-switching) and SeamlessM4T speech-to-speech, so each side hears the other in their own language. Booked meetings and won jobs go back to Meta through the Conversions API, so the business's ads optimise for revenue instead of clicks. Muse Code-style generation then turns the Page's photos, reviews and posts into a one-page website.

The live demo uses Amaka's Oven & Events, a real-world-style bakery in Port Harcourt, Nigeria, so judges can click through the whole pipeline with no setup.

**Public GitHub Repository:** https://github.com/hildanonyelum-cell/SalesCrew

**3-Minute Demo Video:** TBD — (add YouTube/Loom link)

**Describe your use of Meta products to build the submitted project:**
- **Meta Model API, Muse Spark 1.3 (`muse-spark-1.3`):** the primary model for every reasoning path. It powers the scoped WhatsApp/Messenger/IG booking agent, personalised outreach emails, call intent and translation analysis, and one-page site generation. It is called through the OpenAI-compatible `/v1/chat/completions` endpoint with `reasoning_effort: low` to keep chat latency low.
- **Muse Voice Transcribe (`muse-voice-transcribe-1.0`):** the ASR layer for multilingual sales calls, chosen for its diarization and code-switching support.
- **SeamlessM4T (Meta open model):** speech-to-speech translation, so the vendor and client can each speak their own language.
- **Muse Code:** the website-builder pattern (Page content → one-page site), and also used to help code the project.
- **Meta platforms:** WhatsApp Business, Messenger and Instagram messaging (inbound-only, task-scoped agent), Facebook/Instagram Lead Ads plus Page activity as lead sources, and the Conversions API (`Schedule` / `Purchase` events with SHA-256 hashed PII) to close the ad loop.

**Why are Meta's models important to your solution?**
Small businesses in Nigeria already live on WhatsApp, Facebook and Instagram, so their customers and leads are there. Meta's models let one agent understand those conversations: Nigerian English, Pidgin, and English↔Yoruba code-switching mid-sentence. They also let it act inside Meta's own surfaces and send revenue signals back to Meta Ads. Muse Spark is fast and cheap enough to answer every DM in seconds, and it follows a tight business scope reliably. Muse Voice Transcribe and SeamlessM4T make it possible to call a customer in their own language, which no off-the-shelf sales tool does for a Port Harcourt bakery. Without these models, SalesCrew would be an English-only chatbot. With them, it works as a multilingual sales team.

**Feedback from your experience using partner technologies:**
I used NVIDIA NIM (Nemotron 3.5 Super) as an automatic fallback behind Meta Model API, plus Vercel for deployment. The OpenAI-compatible APIs on both sides made a two-provider harness about 40 lines of code. Clearer published rate limits and a shared "health" endpoint across inference partners would make production fallback design easier. More Nigerian-language speech samples in the docs would also help.

**How likely are you to build with Meta Model API?** Very likely (5/5)

**Overall opinion of Meta Model API:** Very positive. It is fast, OpenAI-compatible, easy to adopt, and the Muse Spark family follows scoped system prompts well. Reasoning tokens count against `max_tokens`, so you need to budget for them. Once I did, responses were consistent.

**How likely to recommend Meta Model API to another developer:** 9/10

**How likely to recommend Muse Code:** 9/10

**Biggest obstacle:**
Designing the autonomous messaging layer so it is genuinely useful without crossing Meta's 2026 rules against open-ended assistant chat. I solved it with three controls. A hard inbound-only rule. A scope-guard that refuses off-topic requests and hands off to a human before the model is even called. A booking token protocol, so the agent can only commit to real calendar slots. A second obstacle: live telephony and WhatsApp Business API approvals take longer than ten days, so the demo simulates those channels using the same agent and API contracts.

**Meta's models vs other models you've used:**
Muse Spark 1.3 matched or beat the NVIDIA Nemotron fallback on instruction-following for the scoped booking agent, and on writing natural Nigerian-English customer replies. It was also stronger at the Yoruba translation step. Nemotron had slightly lower raw latency on very short prompts, which is why it stays as the fallback. Overall, Meta's models were the better fit for this project.

**What matters most when choosing an AI model or coding tool:** Quality / accuracy

**Please specify:**
Reliable instruction-following inside a strict scope (so a customer-facing agent never goes off-policy), multilingual and code-switching ability for African languages, latency under about 3 seconds for chat, price per token for a small business budget, and OpenAI-compatible APIs so I can keep a fallback provider.

**What makes it hardest to switch:**
Prompt and guardrail tuning. Each model reacts differently to the same scope rules and booking-token protocol, so switching means re-testing every policy edge case. Speech features like diarization and code-switching are also not equivalent across providers.

**What would most likely stop you from using Meta's models in production:**
Regional availability, pricing and rate-limit guarantees for Africa-based businesses, plus the data-residency and retention terms for customer conversations. Clear SLAs and published pricing would remove that blocker.
