import type { Campaign, CampaignCategory } from "@prisma/client";

type CampaignWithCategories = Campaign & {
  categories: CampaignCategory[];
};

type CampaignFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  campaign?: CampaignWithCategories;
  error?: string;
  submitLabel: string;
};

export function CampaignForm({ action, campaign, error, submitLabel }: CampaignFormProps) {
  const categories = campaign?.categories ?? [];

  return (
    <form action={action} className="grid gap-5">
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <label className="grid gap-2 text-sm font-medium">
        Name
        <input name="name" required defaultValue={campaign?.name} className="rounded-md border bg-background px-3 py-2 font-normal" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Minimum viewers
          <input name="minViewers" type="number" min="0" required defaultValue={campaign?.minViewers ?? 30} className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Maximum viewers
          <input name="maxViewers" type="number" min="1" required defaultValue={campaign?.maxViewers ?? 500} className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Languages
        <input name="languages" required defaultValue={campaign?.languages.join(", ") ?? "EN, PT, ES"} className="rounded-md border bg-background px-3 py-2 font-normal" />
        <span className="text-xs font-normal text-muted-foreground">Comma-separated for now.</span>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Sponsor keywords
        <textarea name="sponsorKeywords" required rows={3} defaultValue={campaign?.sponsorKeywords.join(", ") ?? "#ad, sponsored, use code, creator code, discount, giveaway"} className="rounded-md border bg-background px-3 py-2 font-normal" />
        <span className="text-xs font-normal text-muted-foreground">Comma-separated for now.</span>
      </label>

      <section className="grid gap-3 rounded-lg border bg-muted/30 p-4">
        <div>
          <h2 className="font-medium">Categories</h2>
          <p className="text-sm text-muted-foreground">Manual category rows for V1. Add at least one name and Twitch game ID.</p>
        </div>
        {[0, 1, 2].map((rowIndex) => {
          const category = categories[rowIndex];
          const fieldIndex = rowIndex + 1;

          return (
            <div key={fieldIndex} className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Category name
                <input name={`categoryName${fieldIndex}`} defaultValue={category?.name ?? (rowIndex === 0 ? "Roblox" : "")} className="rounded-md border bg-background px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Twitch game ID
                <input name={`twitchGameId${fieldIndex}`} defaultValue={category?.twitchId ?? (rowIndex === 0 ? "509658" : "")} className="rounded-md border bg-background px-3 py-2 font-normal" />
              </label>
            </div>
          );
        })}
      </section>

      <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        {submitLabel}
      </button>
    </form>
  );
}
