import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">V1 foundation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Find sponsor signals in Twitch markets.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          SponsorScope helps gaming creators research sponsor activity, review signals, confirm leads, and prepare exports.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/campaigns" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            View campaigns
          </Link>
          <Link href="/campaigns/new" className="rounded-md border px-4 py-2 text-sm font-medium">
            New campaign
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Campaigns", "Define categories, viewer ranges, languages, and keywords."],
          ["Signals", "Score stream and VOD titles with deterministic rules."],
          ["Leads", "Confirm high-quality sponsor matches for export."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
