# SponsorScope

[![CI](https://github.com/HanuBehr/SponsorScope/actions/workflows/ci.yml/badge.svg)](https://github.com/HanuBehr/SponsorScope/actions/workflows/ci.yml)

SponsorScope finds brands already sponsoring similar Twitch creators and keeps the evidence attached.

It discovers peer channels, detects sponsorship signals in stream and VOD metadata, groups repeated evidence by creator and exports confirmed leads to Google Sheets.

![SponsorScope sponsor research workspace](docs/assets/sponsorscope-macos-readme-window.png)

## Why I built it

Finding random brands is easy. Finding brands already spending money on creators in the same niche is much more useful.

I built SponsorScope for my own sponsor research workflow, using official APIs, deterministic scoring and manual review instead of treating every keyword match as a real sponsorship.

## How it works

- Discover peer Twitch channels by category, language and viewer range.
- Detect sponsor signals in stream titles, VOD titles and descriptions.
- Add evidence manually from panels, social posts, chat commands and other public sources.
- Group evidence by creator to avoid duplicate review cards.
- Confirm useful findings and export them to Google Sheets.

## Built with

Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Twitch Helix, Google Sheets API, Zod and Vitest.

## Run locally

Clone the repository or use **Code → Download ZIP** on GitHub.

```bash
git clone https://github.com/HanuBehr/SponsorScope.git
cd SponsorScope
npm install
```

Copy `.env.example` to `.env`, add the required Twitch and Google credentials, then run:

```bash
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.
