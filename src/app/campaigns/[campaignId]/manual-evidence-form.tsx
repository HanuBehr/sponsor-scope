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
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Add sponsor evidence manually</h2>
      <p className="mt-1 text-sm text-muted-foreground">Capture sponsor clues you verify in Twitch panels, chat commands, YouTube descriptions, Discord, overlays, or other sources.</p>
      <form action={addManualEvidence} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Peer channel name or URL
          <input name="peerChannel" placeholder="https://www.twitch.tv/channel" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Seen viewers
          <input name="seenViewers" type="number" min="0" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Game/category
          <input name="gameCategory" placeholder="Roblox" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Evidence source type
          <select name="sourceType" defaultValue={SponsorSignalSourceType.TWITCH_PANEL} className="rounded-md border bg-background px-3 py-2 font-normal">
            {manualSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>{sourceType}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Evidence URL
          <input name="evidenceUrl" placeholder="Optional source link" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Evidence text/notes
          <textarea name="evidenceText" required rows={3} placeholder="Example: Twitch panel says Sponsored by X, use code CREATOR10" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsor name
          <input name="sponsorName" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsor category
          <input name="sponsorCategory" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsorship type
          <input name="sponsorshipType" placeholder="Dedicated Stream" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sponsor contact
          <input name="sponsorContact" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input name="createLead" type="checkbox" />
          Create confirmed lead immediately if sponsor name is provided
        </label>
        <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Add evidence
        </button>
      </form>
    </section>
  );
}
