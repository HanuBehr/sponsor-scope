import { describe, expect, it } from "vitest";
import { demoCampaign, getDemoCampaign } from "./demo";

describe("demo fixtures", () => {
  it("uses fictional data and the public demo campaign id", () => {
    expect(demoCampaign.id).toBe("demo-campaign");
    expect(demoCampaign.sponsorLeads[0].sponsorContact).toContain("example.invalid");
  });

  it("does not expose fixtures unless demo mode is enabled", () => {
    expect(getDemoCampaign("demo-campaign")).toBeNull();
  });
});
