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
  const robloxPreset = "sponsored, sponsored by, sponsor, partner, partnered, use code, creator code, promo code, discount, giveaway, drops, paid partnership, presented by, powered by, thanks to, play now, join now, affiliate, ambassador, banner, overlay, !code, !sponsor, !partner";
  const generalPreset = "#ad, sponsored, sponsored by, sponsor, paid partnership, partner, partnered, use code, creator code, promo code, discount, affiliate, referral, ambassador, giveaway, drops, presented by, powered by, thanks to, banner, overlay, !code, !sponsor, !partner, link below, check out";
  const gamblingPreset = "casino partner, casino sponsor, slots sponsor, betting partner, sportsbook, deposit bonus, free spins, bonus code, promo code, use code, affiliate, partner, sponsored, sponsored by, paid partnership, banner, overlay, !code, !sponsor";

  return (
    <form action={action} className="grid gap-5">
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="font-medium">Find sponsors from channels similar to mine</h2>
        <p className="mt-1 text-sm text-muted-foreground">Set up peer-channel sponsor lead research for your Twitch niche.</p>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Campaign name
        <input name="name" required defaultValue={campaign?.name} className="rounded-md border bg-background px-3 py-2 font-normal" />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          My Twitch channel
          <input name="targetChannelName" defaultValue={campaign?.targetChannelName ?? ""} placeholder="Your channel" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          My avg viewers
          <input name="targetAvgViewers" type="number" min="0" defaultValue={campaign?.targetAvgViewers ?? ""} className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          My niche
          <input name="targetNiche" defaultValue={campaign?.targetNiche ?? ""} placeholder="Roblox, variety, casino" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Peer min viewers
          <input name="minViewers" type="number" min="0" required defaultValue={campaign?.minViewers ?? 30} className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Peer max viewers
          <input name="maxViewers" type="number" min="1" required defaultValue={campaign?.maxViewers ?? 500} className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Peer channel languages
        <input name="languages" required defaultValue={campaign?.languages.join(", ") ?? "EN, PT, ES"} className="rounded-md border bg-background px-3 py-2 font-normal" />
        <span className="text-xs font-normal text-muted-foreground">Comma-separated peer channel languages. Use fewer filters if discovery is too narrow.</span>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Sponsor evidence terms
        <textarea name="sponsorKeywords" required rows={4} defaultValue={campaign?.sponsorKeywords.join(", ") ?? robloxPreset} className="rounded-md border bg-background px-3 py-2 font-normal" />
        <span className="text-xs font-normal text-muted-foreground">Use sponsor-intent, conversion, and Twitch-surface terms. Avoid content terms like tycoon, obby, simulator, robux, roleplay, or new update.</span>
      </label>

      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p><span className="font-medium text-foreground">Roblox preset:</span> {robloxPreset}</p>
        <p><span className="font-medium text-foreground">General gaming preset:</span> {generalPreset}</p>
        <p><span className="font-medium text-foreground">Gambling preset:</span> {gamblingPreset}</p>
      </div>

      <section className="grid gap-3 rounded-lg border bg-muted/30 p-4">
        <div>
          <h2 className="font-medium">Peer channel discovery categories</h2>
          <p className="text-sm text-muted-foreground">Add Twitch categories where similar channels stream. Categories help find peer channels; they are not sponsor evidence by themselves.</p>
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
