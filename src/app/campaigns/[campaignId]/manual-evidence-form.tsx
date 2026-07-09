import { SponsorSignalSourceType } from "@prisma/client";
import { addManualEvidenceAction } from "../actions";

type ManualEvidenceFormProps = {
  campaignId: string;
};

const manualSourceTypes = [
  SponsorSignalSourceType.TWITCH_PANEL,
  SponsorSignalSourceType.CHAT_COMMAND,
  SponsorSignalSourceType.YOUTUBE_DESCRIPTION,
  SponsorSignalSourceType.DISCORD_POST,
  SponsorSignalSourceType.TWITTER_X_POST,
  SponsorSignalSourceType.LINKTREE_BEACONS,
  SponsorSignalSourceType.STREAM_OVERLAY,
  SponsorSignalSourceType.OTHER,
];

export function ManualEvidenceForm({ campaignId }: ManualEvidenceFormProps) {
  const addManualEvidence = addManualEvidenceAction.bind(null, campaignId);

  return (
    <section id="manual-evidence" className="rounded-lg bg-card/60 p-4 ring-1 ring-border/70">
      <div>
        <h2 className="font-semibold">Add manual evidence</h2>
        <p className="mt-1 text-sm text-muted-foreground">Save a structured sponsor evidence record from panels, commands, descriptions, Discord, or overlays.</p>
      </div>
      <form action={addManualEvidence} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Channel
          <input name="peerChannel" placeholder="twitch.tv/channel" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Seen Viewers
          <input name="seenViewers" type="number" min="0" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Category
          <input name="gameCategory" placeholder="Roblox" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Source Type
          <select name="sourceType" defaultValue={SponsorSignalSourceType.TWITCH_PANEL} className="rounded border bg-background px-3 py-2 font-normal">
            {manualSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>{sourceType}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          URL
          <input name="evidenceUrl" placeholder="Optional source link" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Proof Text
          <textarea name="evidenceText" required rows={3} placeholder="Sponsored by X / use code CREATOR10" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsor
          <input name="sponsorName" placeholder="Optional" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsor Category
          <input name="sponsorCategory" placeholder="Optional" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Type
          <input name="sponsorshipType" placeholder="Dedicated Stream" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Contact
          <input name="sponsorContact" placeholder="Optional" className="rounded border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
          <input name="createLead" type="checkbox" />
          Create lead if sponsor exists
        </label>
        <button type="submit" className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:w-fit">
          Save Evidence
        </button>
      </form>
    </section>
  );
}
