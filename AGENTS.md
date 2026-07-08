@'

\# SponsorScope



SponsorScope is a sponsor market research dashboard for gaming creators.



The first use case is finding sponsors that work with small-to-mid Roblox Twitch creators, but the app must support any Twitch game/category.



\## Product framing



Do not call this a scraper. This is a market research dashboard and lead intelligence tool.



\## V1 stack



\- Next.js 15 App Router

\- TypeScript

\- TailwindCSS

\- shadcn/ui

\- Prisma

\- PostgreSQL

\- Twitch Helix API

\- Google Sheets API

\- deterministic sponsor signal scoring



\## Avoid in V1



Do not add:

\- NestJS

\- Redis

\- BullMQ

\- Playwright

\- auth

\- payments

\- browser scraping

\- complex multi-agent orchestration



\## Core workflow



1\. Create a campaign.

2\. Add Twitch games/categories.

3\. Set viewer range, languages, and sponsor keywords.

4\. Fetch live streams through Twitch Helix API.

5\. Filter channels by viewer count and language.

6\. Fetch recent VOD metadata.

7\. Detect sponsor signals in stream and VOD titles.

8\. Review signals manually.

9\. Confirm good signals as sponsor leads.

10\. Export confirmed leads to Google Sheets.



\## Engineering rules



\- Keep it simple and working.

\- Prefer direct server-side services.

\- Keep Twitch logic in `src/lib/twitch`.

\- Keep Sheets logic in `src/lib/sheets`.

\- Keep scoring logic in `src/lib/scoring`.

\- Use Zod for validation.

\- Use Prisma server-side only.

\- Add tests for scoring.

\- Add seed data for demos.

\- Do not add V2 architecture before V1 finds real leads.

'@ | Set-Content -Encoding UTF8 AGENTS.md

