import type { Campaign, CampaignCategory } from "@prisma/client";
import Link from "next/link";

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
    <form action={action} className="grid gap-8">
      {error ? <div className="rounded bg-muted/60 p-3 text-sm text-foreground ring-1 ring-border/70">{error}</div> : null}

      <section className="grid gap-4">
        <div>
          <h2 className="text-base font-semibold">Peer channel target</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define your channel context so peer research stays focused.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Campaign name
            <input name="name" required defaultValue={campaign?.name} className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Target channel
            <input name="targetChannelName" defaultValue={campaign?.targetChannelName ?? ""} placeholder="Your Twitch channel" className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Avg viewers
            <input name="targetAvgViewers" type="number" min="0" defaultValue={campaign?.targetAvgViewers ?? ""} className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Niche
            <input name="targetNiche" defaultValue={campaign?.targetNiche ?? ""} placeholder="Roblox, variety, casino" className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 border-t border-border/70 pt-6">
        <div>
          <h2 className="text-base font-semibold">Discovery filters</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set peer viewer range, languages, and Twitch category IDs.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            Min viewers
            <input name="minViewers" type="number" min="0" required defaultValue={campaign?.minViewers ?? 30} className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Max viewers
            <input name="maxViewers" type="number" min="1" required defaultValue={campaign?.maxViewers ?? 500} className="rounded border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Languages
            <input name="languages" required defaultValue={campaign?.languages.join(", ") ?? "EN, PT, ES"} className="rounded border bg-background px-3 py-2 font-normal" />
            <span className="text-xs font-normal text-muted-foreground">Comma-separated. Use fewer filters if discovery is narrow.</span>
          </label>
        </div>

        <div className="grid gap-3">
          <div className="text-sm text-muted-foreground">
            Twitch IDs are category/game IDs. Examples: Roblox <span className="font-mono text-foreground">23020</span>, Just Chatting <span className="font-mono text-foreground">509658</span>, Virtual Casino <span className="font-mono text-foreground">29452</span>.
          </div>
        {[0, 1, 2].map((rowIndex) => {
          const category = categories[rowIndex];
          const fieldIndex = rowIndex + 1;

          return (
            <div key={fieldIndex} className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Category name
                <input name={`categoryName${fieldIndex}`} defaultValue={category?.name ?? (rowIndex === 0 ? "Roblox" : "")} className="rounded border bg-background px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Twitch ID
                <input name={`twitchGameId${fieldIndex}`} defaultValue={category?.twitchId ?? (rowIndex === 0 ? "23020" : "")} className="rounded border bg-background px-3 py-2 font-mono text-sm font-normal" />
              </label>
            </div>
          );
        })}
        </div>
      </section>

      <section className="grid gap-4 border-t border-border/70 pt-6">
        <div>
          <h2 className="text-base font-semibold">Sponsor evidence terms</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use sponsor-intent, conversion, and Twitch-surface terms.</p>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Evidence terms
          <textarea name="sponsorKeywords" required rows={5} defaultValue={campaign?.sponsorKeywords.join(", ") ?? robloxPreset} className="rounded border bg-background px-3 py-2 font-normal leading-6" />
        </label>

        <div className="grid gap-3 rounded bg-muted/30 p-3 text-sm text-muted-foreground lg:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">Roblox preset</p>
            <p className="mt-1 text-xs leading-5">{robloxPreset}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">General gaming preset</p>
            <p className="mt-1 text-xs leading-5">{generalPreset}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Gambling preset</p>
            <p className="mt-1 text-xs leading-5">{gamblingPreset}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 border-t border-border/70 pt-6 sm:flex sm:flex-wrap sm:items-center">
        <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{submitLabel}</button>
        <Link href={campaign ? `/campaigns/${campaign.id}` : "/campaigns"} className="rounded px-4 py-2 text-center text-sm text-primary ring-1 ring-primary/40 hover:bg-primary/10">Cancel</Link>
      </section>
    </form>
  );
}
