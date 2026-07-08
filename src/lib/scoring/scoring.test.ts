import { describe, expect, it } from "vitest";
import { extractSponsorName, getConfidence, scoreSponsorSignal } from "./index";

const keywords = ["#ad", "sponsored", "giveaway", "early access", "new game"];

describe("scoreSponsorSignal", () => {
  it("matches campaign keywords exactly", () => {
    const result = scoreSponsorSignal("early access", keywords);

    expect(result.score).toBe(35);
    expect(result.matchedKeywords).toContain("early access");
    expect(result.confidence).toBe("LOW");
  });

  it("matches campaign keywords partially", () => {
    const result = scoreSponsorSignal("Trying a new game tonight", keywords);

    expect(result.score).toBe(15);
    expect(result.matchedKeywords).toContain("new game");
    expect(result.hasSignal).toBe(false);
  });

  it("scores rule thresholds deterministically", () => {
    expect(scoreSponsorSignal("Sponsored by BlockBites", []).score).toBe(50);
    expect(scoreSponsorSignal("Partnered with BlockBites", []).score).toBe(45);
    expect(scoreSponsorSignal("#ad Roblox stream", []).score).toBe(40);
    expect(scoreSponsorSignal("Use code BLOCKS", []).score).toBe(35);
    expect(scoreSponsorSignal("30% off today", []).score).toBe(30);
    expect(scoreSponsorSignal("Giveaway after stream", []).score).toBe(20);
  });

  it("calculates confidence from score", () => {
    expect(getConfidence(70)).toBe("HIGH");
    expect(getConfidence(69)).toBe("MEDIUM");
    expect(getConfidence(40)).toBe("MEDIUM");
    expect(getConfidence(39)).toBe("LOW");
    expect(getConfidence(20)).toBe("LOW");
    expect(getConfidence(19)).toBeNull();
  });

  it("returns no signal below threshold", () => {
    const result = scoreSponsorSignal("Casual Roblox stream", []);

    expect(result.hasSignal).toBe(false);
    expect(result.confidence).toBeNull();
  });

  it("extracts obvious sponsor names", () => {
    expect(extractSponsorName("Sponsored by BlockBites - Roblox tycoon night")).toBe("BlockBites");
    expect(extractSponsorName("Partnered with Creator Crate for drops")).toBe("Creator Crate");
    expect(extractSponsorName("Thanks to GameFuel for sponsoring")).toBe("GameFuel");
    expect(extractSponsorName("Use code BLOXBOOST tonight")).toBe("BLOXBOOST");
  });
});
