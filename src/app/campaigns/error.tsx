"use client";

type CampaignsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function CampaignsError({ error, reset }: CampaignsErrorProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Campaigns could not load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Try again
      </button>
    </div>
  );
}
