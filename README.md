# SponsorScope

SponsorScope is a sponsor lead research dashboard I built for a specific Twitch creator workflow: finding brands that are already sponsoring peer channels, reviewing the evidence, and exporting outreach-ready leads into Google Sheets.

It is intentionally scoped as a practical market research and lead intelligence tool. The app uses official APIs, deterministic scoring, and manual review instead of browser scraping or automated outreach.

## Why I Built This

Small and mid-sized Twitch creators often need to research sponsorship opportunities manually: checking peer channels, looking for sponsor mentions, tracking brands, and keeping outreach lists updated. SponsorScope turns that workflow into a focused dashboard.

The first use case is researching sponsors around Roblox Twitch creators, but the campaign model supports any Twitch game/category, viewer range, and language mix.

## What It Does

- Creates sponsor research campaigns for a target Twitch niche.
- Uses Twitch Helix to discover live peer channels by category, language, and viewer range.
- Fetches recent VOD metadata for discovered channels.
- Detects sponsor evidence in stream titles, VOD titles, VOD descriptions, and manual evidence entries.
- Groups evidence by peer channel so review is channel-level instead of duplicate-signal noise.
- Lets an operator confirm useful signals into sponsor leads.
- Captures manual evidence from Twitch panels, chat commands, YouTube descriptions, Discord posts, Linktree/Beacons, overlays, and other sources.
- Exports confirmed, unexported leads to a preformatted Google Sheets tracker.

## Product Workflow

1. Create a research campaign.
2. Add Twitch categories, viewer range, languages, and sponsor evidence terms.
3. Run Twitch discovery for live peer channels.
4. Detect sponsor evidence from stream and VOD metadata.
5. Review grouped evidence by peer channel.
6. Add manual evidence where needed.
7. Confirm useful sponsor signals as leads.
8. Export confirmed leads to Google Sheets.

## Technical Highlights

- Next.js 15 App Router with server actions.
- TypeScript throughout the application.
- Prisma data model backed by PostgreSQL/Supabase.
- Twitch Helix API integration for live stream and VOD metadata.
- Google Sheets API integration with append-only exports.
- Deterministic sponsor evidence scoring with Vitest coverage.
- Zod validation for environment/configuration boundaries.
- Dark responsive operator UI built with TailwindCSS.

## Architecture Notes

The project keeps the V1 architecture deliberately direct:

- Twitch API code lives in `src/lib/twitch`.
- Google Sheets code lives in `src/lib/sheets`.
- Sponsor scoring code lives in `src/lib/scoring`.
- Prisma is used server-side only.
- Review and export workflows run through Next.js server actions.
- Scoring is deterministic and testable rather than AI-dependent.

This keeps the app easy to reason about and avoids unnecessary infrastructure for the first production-shaped version.

## Tech Stack

- Next.js 15 App Router
- React
- TypeScript
- TailwindCSS
- Prisma
- PostgreSQL / Supabase
- Twitch Helix API
- Google Sheets API
- Zod
- Vitest

## Google Sheets Export Contract

SponsorScope assumes the destination spreadsheet is already formatted for outreach tracking. It only appends rows and avoids overwriting template/header content.

- Required tabs: `ROBLOX`, `General Gaming`, `Gambling`.
- Export range starts at `B8:I`.
- Column A is left untouched.
- Rows 1-7 are left untouched.
- Export uses `spreadsheets.values.append` with `USER_ENTERED` and `INSERT_ROWS`.
- Leads route to a tab based on source game/category context.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`, then fill in the required values.

Apply migrations:

```bash
npm run prisma:migrate
```

Seed demo data:

```bash
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```env
DATABASE_URL=""
TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
GOOGLE_SHEETS_SPREADSHEET_ID=""
```

`GOOGLE_PRIVATE_KEY` may contain escaped newlines like `\n`; the app normalizes them before creating the Google client.

## Supabase / PostgreSQL Notes

- Use a PostgreSQL database URL for `DATABASE_URL`.
- For Supabase, Prisma usually works best with the session pooler on port `5432`.
- URL encode the Supabase password if it contains special characters.
- Run `npm run prisma:migrate` after pulling schema changes.
- Run `npm run prisma:generate` if Prisma Client types look stale.

## Twitch Setup

1. Create an app in the Twitch Developer Console.
2. Copy the client ID into `TWITCH_CLIENT_ID`.
3. Copy the client secret into `TWITCH_CLIENT_SECRET`.

SponsorScope uses server-side client credentials auth only.

## Google Sheets Setup

1. Create a Google Cloud service account.
2. Enable the Google Sheets API.
3. Create a service account key.
4. Put the service account email in `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
5. Put the private key in `GOOGLE_PRIVATE_KEY`.
6. Put the spreadsheet ID in `GOOGLE_SHEETS_SPREADSHEET_ID`.
7. Share the target Google Sheet with the service account email as Editor.

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

Run scoring tests:

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
- Keeping the architecture practical and maintainable instead of overengineering V1.

## Notes

SponsorScope is a market research dashboard and lead intelligence tool. It does not use browser scraping, automated outreach, email enrichment, auth, payments, Redis, BullMQ, or AI-generated lead scoring in V1.
