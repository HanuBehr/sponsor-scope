import { SponsorSignalSourceType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildSignalSourceKey } from "./detection";

describe("buildSignalSourceKey", () => {
  it("normalizes equivalent source titles for detection dedupe", () => {
    const first = buildSignalSourceKey({
      channelId: "channel-1",
      streamSnapshotId: "snapshot-1",
      sourceType: SponsorSignalSourceType.STREAM_TITLE,
      sourceTitle: "Sponsored   by NeonFuel",
    });
    const second = buildSignalSourceKey({
      channelId: "channel-1",
      streamSnapshotId: "snapshot-1",
      sourceType: SponsorSignalSourceType.STREAM_TITLE,
      sourceTitle: " sponsored by neonfuel ",
    });

    expect(second).toBe(first);
  });

  it("keeps title and description evidence separate for the same VOD", () => {
    const titleKey = buildSignalSourceKey({
      channelId: "channel-1",
      vodId: "vod-1",
      sourceType: SponsorSignalSourceType.VOD_TITLE,
      sourceTitle: "Sponsored by NeonFuel",
    });
    const descriptionKey = buildSignalSourceKey({
      channelId: "channel-1",
      vodId: "vod-1",
      sourceType: SponsorSignalSourceType.VOD_DESCRIPTION,
      sourceTitle: "Sponsored by NeonFuel",
    });

    expect(descriptionKey).not.toBe(titleKey);
  });
});
