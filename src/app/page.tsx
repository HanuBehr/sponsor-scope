import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [campaignCount, signalCount, leadCount] = await Promise.all([
    prisma.campaign.count(),
    prisma.sponsorSignal.count(),
    prisma.sponsorLead.count(),
  ]);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-card/80 p-5 ring-1 ring-border/70 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">SponsorScope</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Find sponsors already working with channels like yours.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">SponsorScope researches peer Twitch channels, detects sponsor evidence, helps you confirm outreach-ready leads, and exports them to your Google Sheets tracker.</p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
            <Link href="/campaigns/new" className="rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.16)]">New research campaign</Link>
            <Link href="/campaigns" className="rounded px-4 py-2 text-center text-sm text-primary ring-1 ring-primary/40 hover:bg-primary/10">View campaigns</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["Campaigns", campaignCount],
          ["Evidence signals", signalCount],
          ["Confirmed leads", leadCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-card/70 p-4 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg bg-card/60 p-5 ring-1 ring-border/60">
        <h2 className="font-semibold">Workflow</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1", "Discover peer channels", "Fetch live channels and recent VOD metadata from Twitch."],
            ["2", "Detect sponsor evidence", "Score stream titles, VOD titles, descriptions, and manual entries."],
            ["3", "Review by channel", "Group evidence by peer creator so review stays focused."],
            ["4", "Export leads", "Append confirmed outreach-ready rows to Google Sheets."],
          ].map(([step, title, body]) => (
            <div key={title} className="rounded bg-muted/45 p-3">
              <span className="text-xs font-semibold text-primary">{step}</span>
              <p className="font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Twitch discovery", "Find live peer channels and recent VOD metadata through Twitch Helix."],
          ["Channel-level signal review", "Review sponsor evidence grouped by creator instead of isolated duplicates."],
          ["Manual evidence capture", "Add proof from panels, chat commands, descriptions, Discord, or overlays."],
          ["Google Sheets export", "Export confirmed leads into the existing outreach tracker format."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg bg-card/55 p-4 ring-1 ring-border/60">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
