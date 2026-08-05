# SponsorScope

[![CI](https://github.com/HanuBehr/sponsor-scope/actions/workflows/ci.yml/badge.svg)](https://github.com/HanuBehr/sponsor-scope/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-00ff66?labelColor=050806&color=00ff66)
![TypeScript](https://img.shields.io/badge/TypeScript-5-00ff66?labelColor=050806&color=00ff66)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-00ff66?labelColor=050806&color=00ff66)
![Twitch Helix](https://img.shields.io/badge/Twitch-Helix-00ff66?labelColor=050806&color=00ff66)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Export-00ff66?labelColor=050806&color=00ff66)

SponsorScope finds brands already sponsoring similar Twitch creators and keeps the evidence attached.

It discovers peer channels, detects sponsorship signals in stream and VOD metadata, groups repeated evidence by creator and exports confirmed leads to Google Sheets.

![SponsorScope sponsor research workspace](docs/assets/sponsorscope-macos-readme-window.png)

<p>
  <a href="#run-locally"><strong>Run locally</strong></a> ·
  <a href="#public-demo-mode"><strong>Demo mode</strong></a> ·
  <a href="#how-it-works"><strong>How it works</strong></a> ·
  <a href="#technical-highlights"><strong>Technical highlights</strong></a> ·
  <a href="docs/architecture.md"><strong>Architecture</strong></a>
</p>

## Why I built it

Finding random brands is easy. Finding brands already spending money on creators in the same niche is much more useful.

I built SponsorScope for my own sponsor research workflow, using official APIs, deterministic scoring and manual review instead of treating every keyword match as a real sponsorship.

## How it works

- Discover peer Twitch channels by category, language and viewer range.
- Detect sponsor signals in stream titles, VOD titles and descriptions.
- Add evidence manually from panels, social posts, chat commands and other public sources.
- Group evidence by creator to avoid duplicate review cards.
- Confirm useful findings and export them to Google Sheets.

## Technical Highlights

- Next.js 15 App Router with server actions for campaign, review, export, and evidence workflows.
- TypeScript and Prisma over a PostgreSQL/Supabase data model for campaigns, channels, discovery runs, signals, leads, and export logs.
- Twitch Helix API integration for live stream and VOD metadata.
- Google Sheets API integration with append-only row export and tab routing.
- Ingestion and export idempotency keys for safer retries.
- Deterministic sponsor evidence scoring with Vitest coverage.
- Zod validation for environment/configuration boundaries.
- Responsive Matrix-inspired operator UI built with TailwindCSS.

## Built with

Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Twitch Helix, Google Sheets API, Zod and Vitest.

## Architecture Notes

See [`docs/architecture.md`](docs/architecture.md) for the detailed V1 architecture, data flow, and operational boundaries.

- Twitch API code lives in `src/lib/twitch`.
- Google Sheets code lives in `src/lib/sheets`.
- Sponsor scoring code lives in `src/lib/scoring`.
- Prisma is used server-side only.
- Review and export workflows run through Next.js server actions.
- Scoring is deterministic and testable rather than AI-dependent.

## Google Sheets Export Contract

SponsorScope assumes the destination spreadsheet is already formatted for outreach tracking. It only appends rows and avoids overwriting template/header content.

- Required tabs: `ROBLOX`, `General Gaming`, `Gambling`.
- Export range starts at `B8:I`.
- Column A is left untouched.
- Rows 1-7 are left untouched.
- Export uses `spreadsheets.values.append` with `USER_ENTERED` and `INSERT_ROWS`.
- Leads route to a tab based on source game/category context.
- Export attempts claim leads with a batch key before append; ambiguous retries stop for manual reconciliation instead of duplicating rows.

## Run locally

Clone the repository or use **Code -> Download ZIP** on GitHub.

```bash
git clone https://github.com/HanuBehr/sponsor-scope.git
cd sponsor-scope
npm install
```

Copy `.env.example` to `.env`, add the required Twitch and Google credentials, then run:

```bash
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Public Demo Mode

Demo mode renders fictional read-only campaign, evidence, lead, and export-log fixtures. It does not require Twitch credentials, Google credentials, or a database connection.

```env
NEXT_PUBLIC_DEMO_MODE="true"
DEMO_MODE="true"
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000/campaigns/demo-campaign`. Demo actions redirect with a read-only message instead of writing to APIs or storage.

## Environment Variables

```env
DATABASE_URL=""
NEXT_PUBLIC_DEMO_MODE="false"
DEMO_MODE="false"
TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
GOOGLE_SHEETS_SPREADSHEET_ID=""
```

`GOOGLE_PRIVATE_KEY` may contain escaped newlines like `\n`; the app normalizes them before creating the Google client.

## Setup Notes

- For Supabase, Prisma usually works best with the session pooler on port `5432`.
- URL encode the Supabase password if it contains special characters.
- Twitch credentials come from a Twitch Developer Console app using server-side client credentials auth.
- Google Sheets export requires a service account with Editor access to the target spreadsheet.

## Useful Scripts

```bash
npm run dev
npm run build
npm test
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## Testing

Run tests:

```bash
npm test
```

Run a production build:

```bash
npm run build
```

## Demo Checklist

- Open the homepage and campaign registry.
- Create or open a research campaign.
- Run Twitch discovery.
- Detect sponsor signals.
- Review grouped peer-channel evidence.
- Add manual evidence.
- Confirm a sponsor signal as a lead.
- Open the leads page.
- Export unexported leads to Google Sheets.

## What This Demonstrates

- Building a full-stack workflow tool around a real creator/business use case.
- Designing a data model for campaigns, channels, discovery runs, evidence signals, leads, and export logs.
- Integrating third-party APIs with server-side service boundaries.
- Using deterministic scoring to reduce noisy sponsor evidence review.
- Creating an append-only export workflow that respects a preformatted business tracker.
- Keeping V1 practical instead of adding unnecessary infrastructure.

## Notes

SponsorScope is a market research dashboard and lead intelligence tool. It does not use browser scraping, automated outreach, email enrichment, auth, payments, Redis, BullMQ, or AI-generated lead scoring in V1.
