# SponsorScope Architecture

SponsorScope V1 is a direct server-side Next.js workflow app for Twitch sponsor research. It uses official APIs, deterministic scoring, and manual review.

## Boundaries

- `src/lib/twitch`: Twitch Helix auth, live-stream discovery, and VOD metadata ingestion.
- `src/lib/scoring`: deterministic sponsor-signal scoring and sponsor-name extraction.
- `src/lib/signals`: evidence detection and source-key generation.
- `src/lib/sheets`: Google Sheets row formatting, tab routing, append-only export, and export retry markers.
- `src/app/campaigns`: campaign setup, discovery, review, manual evidence, lead confirmation, and export actions.
- Prisma is server-side only.

## Data Flow

1. A campaign defines Twitch categories, viewer range, languages, and sponsor evidence terms.
2. Discovery calls Twitch Helix for live streams by category and filters by viewer count and language.
3. Matching streams upsert channels and idempotent stream snapshots for the discovery run.
4. Recent VOD metadata is upserted by Twitch VOD ID.
5. Detection scores stream titles, VOD titles, and VOD descriptions with deterministic rules.
6. Signals are grouped by peer channel for manual review.
7. Confirmed signals become sponsor leads.
8. Export appends confirmed, unexported leads to Google Sheets tabs starting at `B8:I`.

## Idempotency

- Channels are keyed by Twitch user ID and login.
- VODs are keyed by Twitch VOD ID.
- Stream snapshots are unique per discovery run and Twitch stream ID.
- Sponsor signals include a stable `sourceKey` scoped by campaign and source type.
- Manual evidence uses the same signal-key path, so repeated submissions update the same signal.
- Export attempts claim leads with `exportBatchKey` before appending rows.

## Export Reliability

Google Sheets append is not transactional with Postgres. SponsorScope avoids unsafe automatic retries by recording a batch key before append.

If append fails before rows are written, the claim is cleared and the lead can be retried. If append succeeds but a database update fails, the claim remains and later retries stop with a reconciliation error instead of appending duplicates.

## Demo Mode

Demo mode is controlled by `NEXT_PUBLIC_DEMO_MODE=true` or `DEMO_MODE=true`. It renders fictional fixture data and short-circuits mutation actions. It does not call Twitch, Google Sheets, or the database.

## Non-Goals In V1

- Browser scraping.
- AI lead scoring.
- Automated outreach.
- Auth, payments, Redis, BullMQ, or queue infrastructure.
- Email enrichment or contact discovery automation.
