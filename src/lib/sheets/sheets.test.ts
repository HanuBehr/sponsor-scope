import { describe, expect, it } from "vitest";
import { createExportBatchKey, formatSponsorLeadExportRow, getLeadExportTabName, latestViewerCountsFromSnapshots } from "./index";

const baseLead = {
  id: "lead-1",
  channelId: "channel-1",
  sponsorName: "NeonFuel",
  sponsorCategory: "Energy Drink",
  sponsorshipType: "Dedicated Stream",
  sponsorContact: "partnerships@example.invalid",
  outreachStatus: "Not Contacted",
  notes: "Reviewed manually",
  sourceUrl: "https://example.invalid/source",
  channel: { displayName: "PixelPilot", login: "pixelpilot" },
  campaign: { categories: [{ name: "Roblox" }] },
  sponsorSignal: {
    manualGameCategory: null,
    streamSnapshot: { gameName: "Roblox", viewerCount: 184 },
  },
} as never;

describe("Google Sheets export helpers", () => {
  it("formats rows for the B8:I export contract", () => {
    expect(formatSponsorLeadExportRow(baseLead)).toEqual([
      "PixelPilot",
      184,
      "NeonFuel",
      "Energy Drink",
      "Dedicated Stream",
      "partnerships@example.invalid",
      "Not Contacted",
      "Reviewed manually",
    ]);
  });

  it("routes Roblox context to the ROBLOX tab", () => {
    expect(getLeadExportTabName(baseLead)).toBe("ROBLOX");
  });

  it("uses the first snapshot per channel from a descending result set", () => {
    const counts = latestViewerCountsFromSnapshots([
      { channelId: "channel-1", viewerCount: 200 },
      { channelId: "channel-2", viewerCount: 90 },
      { channelId: "channel-1", viewerCount: 150 },
    ]);

    expect(counts.get("channel-1")).toBe(200);
    expect(counts.get("channel-2")).toBe(90);
  });

  it("creates stable export batch keys regardless of lead order", () => {
    expect(createExportBatchKey("campaign-1", "ROBLOX", ["lead-b", "lead-a"])).toBe(createExportBatchKey("campaign-1", "ROBLOX", ["lead-a", "lead-b"]));
  });
});
