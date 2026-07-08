import { describe, expect, it } from "vitest";
import { extractSponsorName, getConfidence, scoreSponsorSignal } from "./index";

const keywords = ["#ad", "sponsored", "giveaway", "paid partnership", "presented by"];

describe("scoreSponsorSignal", () => {
  it("matches campaign sponsor-evidence keywords exactly", () => {
    const result = scoreSponsorSignal("paid partnership", keywords);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.matchedKeywords).toContain("paid partnership");
    expect(result.confidence).toBe("HIGH");
  });

  it("boosts campaign sponsor-evidence keyword matches", () => {
    const result = scoreSponsorSignal("Stream presented by GameFuel", keywords);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.matchedKeywords).toContain("presented by");
    expect(result.hasSignal).toBe(true);
  });

  it("creates signals from sponsor phrases", () => {
    expect(scoreSponsorSignal("Sponsored by G FUEL", []).hasSignal).toBe(true);
    expect(scoreSponsorSignal("Partnered with NordVPN", []).hasSignal).toBe(true);
    expect(scoreSponsorSignal("Powered by Opera GX", []).hasSignal).toBe(true);
    expect(scoreSponsorSignal("Presented by X", []).hasSignal).toBe(true);
  });

  it("creates a signal from use code", () => {
    const result = scoreSponsorSignal("Use code GAMER10", []);

    expect(result.hasSignal).toBe(true);
    expect(result.confidence).toBe("MEDIUM");
  });

  it("does not make code alone high-confidence noise", () => {
    const result = scoreSponsorSignal("Roblox code door puzzle", []);

    expect(result.hasSignal).toBe(false);
    expect(result.confidence).toBeNull();
  });

  it("creates a signal from gambling bonus code", () => {
    const result = scoreSponsorSignal("Casino bonus code tonight", []);

    expect(result.hasSignal).toBe(true);
    expect(result.matchedContextTerms).toContain("casino");
  });

  it("does not create signals from context-only terms", () => {
    for (const title of ["Playing Roblox tycoon", "New gamepass update", "Obby with viewers", "Simulator grind", "Roleplay server"]) {
      const result = scoreSponsorSignal(title, []);

      expect(result.hasSignal).toBe(false);
      expect(result.confidence).toBeNull();
    }
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
    expect(extractSponsorName("Powered by Opera GX")).toBe("Opera GX");
    expect(extractSponsorName("Thanks to GameFuel for sponsoring")).toBe("GameFuel");
    expect(extractSponsorName("Use code BLOXBOOST tonight")).toBe("BLOXBOOST");
  });
});
