"use client";

type CampaignsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function CampaignsError({ error, reset }: CampaignsErrorProps) {
  return (
    <div className="rounded bg-muted/50 p-4 ring-1 ring-border/70">
      <h1 className="font-semibold">Campaigns could not load</h1>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 bg-primary px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
        Try again
      </button>
    </div>
  );
}
