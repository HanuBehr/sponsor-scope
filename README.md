# SponsorScope

SponsorScope is a sponsor lead research tool for my own Twitch channel: it researches peer Twitch channels, finds sponsor evidence, turns useful mentions into outreach-ready leads, and exports confirmed leads to my Google Sheets tracker.

## Features

- Peer-channel research campaigns by Twitch category, viewer range, and language.
- Twitch Helix discovery for live peer streams and recent VOD metadata.
- Deterministic sponsor evidence scoring for stream titles, VOD titles, VOD descriptions, and manual evidence.
- Channel-level sponsor evidence review so duplicate signals from the same peer channel are grouped together.
- Manual evidence capture for Twitch panels, chat commands, YouTube descriptions, Discord posts, Twitter/X posts, Linktree/Beacons, stream overlays, and other sources.
- Lead confirmation workflow with sponsor category, sponsorship type, contact, outreach status, and notes.
- Append-only Google Sheets export for confirmed, unexported leads.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- TailwindCSS
- shadcn/ui-ready structure
- Prisma
- PostgreSQL / Supabase
- Zod env validation
- Twitch Helix API
- Google Sheets API
- Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in the required values.

3. Apply database migrations:

```bash
npm run prisma:migrate
```

4. Seed demo data:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Required Env Vars

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
- If the Supabase password contains special characters, URL encode the password before putting it in `DATABASE_URL`.
- Run `npm run prisma:migrate` after pulling schema changes.
- Run `npm run prisma:generate` if Prisma Client types look stale.

## Twitch Credentials

1. Create a Twitch developer app in the Twitch Developer Console.
2. Copy the app client ID into `TWITCH_CLIENT_ID`.
3. Copy the app client secret into `TWITCH_CLIENT_SECRET`.
4. SponsorScope uses server-side client credentials auth only.

## Google Sheets Setup

1. Create a Google Cloud service account.
2. Enable the Google Sheets API for the project.
3. Create a service account key.
4. Put the service account email in `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
5. Put the private key in `GOOGLE_PRIVATE_KEY`.
6. Put the target spreadsheet ID in `GOOGLE_SHEETS_SPREADSHEET_ID`.
7. Share the target Google Sheet with the service account email as Editor.

## Google Sheet Requirements

The target sheet is assumed to already be formatted. SponsorScope only appends values.

- Required tabs: `ROBLOX`, `General Gaming`, `Gambling`.
- Export range starts at `B8:I`.
- Column A is left blank.
- Rows 1-7 are never overwritten.
- Export uses `spreadsheets.values.append` with `USER_ENTERED` and `INSERT_ROWS`.
- Confirmed leads route to a tab by source game/category context.

## Workflows

### Twitch Discovery

1. Create a campaign for peer-channel research.
2. Add discovery categories such as `Roblox` or another Twitch game/category.
3. Set peer viewer range and languages.
4. Open the campaign detail page.
5. Click `Run discovery`.
6. Review discovery stats: fetched streams, matched streams, filtered viewers, filtered languages, and VODs fetched.

If discovery returns nothing, lower min viewers, expand max viewers, add languages, run discovery at another time, or try broader categories like Just Chatting.

### Sponsor Signal Detection

1. Run discovery first.
2. Click `Detect sponsor signals` on the campaign detail page.
3. The app scores stream titles, VOD titles, and VOD descriptions.
4. Context-only content terms do not create sponsor signals by themselves.
5. Open the signals page to review grouped peer-channel evidence.

### Channel-Level Review

1. Open `/campaigns/[campaignId]/signals`.
2. Review one card per peer channel.
3. Open the Twitch channel from the card.
4. Review all evidence items found for that peer channel.
5. Confirm useful sponsor evidence as a lead or reject all new signals for that channel.

### Manual Evidence

1. Use `Add sponsor evidence manually` on the campaign detail page or signals page.
2. Enter peer channel name or URL.
3. Add optional seen viewers and game/category.
4. Select the source type.
5. Add evidence URL if available.
6. Add required evidence text/notes.
7. Optionally provide sponsor fields and create a confirmed lead immediately.

### Lead Confirmation

1. Confirm a signal from the channel-level review card.
2. Enter or adjust sponsor name.
3. Add sponsor category, sponsorship type, sponsor contact, outreach status, and notes where useful.
4. Confirmed leads appear on the leads page.

### Google Sheets Export

1. Open `/campaigns/[campaignId]/leads`.
2. Fill or adjust export fields on confirmed leads.
3. Click `Export unexported leads to Google Sheets`.
4. The app appends only unexported confirmed leads.
5. Exported leads are marked with exported tab, sheet ID/range, and export time.

## Common Issues

- Google Sheet permission denied: share the Google Sheet with the service account email as Editor.
- Supabase connection fails: URL encode the database password if it contains special characters.
- Prisma cannot connect to Supabase: use the Supabase session pooler on port `5432` for Prisma.
- Prisma Client generation is locked on Windows: stop the Next dev server, then run `npm run prisma:generate` again.
- Twitch discovery finds no streams: broaden viewer/language filters or run discovery at a different time.

## Windows Prisma DLL Lock

On Windows, Prisma may fail with an `EPERM` rename error for `query_engine-windows.dll.node` if the Next dev server is running. Stop `npm run dev`, run `npm run prisma:generate` or `npm run prisma:migrate`, then restart `npm run dev`.

## Demo Checklist

- Create or open the demo campaign.
- Confirm peer channel fields, categories, viewer range, languages, and sponsor evidence terms.
- Run Twitch discovery.
- Detect sponsor signals.
- Review grouped peer-channel evidence.
- Open a Twitch channel from a review card.
- Add manual sponsor evidence.
- Confirm a signal as a lead.
- Edit lead export fields.
- Export unexported leads to Google Sheets.
- Verify the row appends to `ROBLOX`, `General Gaming`, or `Gambling` in `B8:I`.

## Useful Scripts

```bash
npm run dev
npm run build
npm test
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## CV Bullet Points

- Built SponsorScope, a Next.js/TypeScript sponsor lead research dashboard for Twitch creators using Prisma, PostgreSQL, Twitch Helix, and Google Sheets API.
- Implemented deterministic sponsor evidence scoring that separates sponsor-intent, conversion, Twitch-surface, weak collaboration, and context-only terms to reduce noisy detections.
- Designed a peer-channel review workflow that groups duplicate sponsor signals by Twitch channel and converts verified evidence into outreach-ready leads.
- Added append-only Google Sheets export with tab routing, export logs, and safe write constraints that preserve preformatted outreach dashboards.
