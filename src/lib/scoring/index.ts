export type SponsorConfidence = "LOW" | "MEDIUM" | "HIGH";

export type SponsorSignalScore = {
  hasSignal: boolean;
  score: number;
  confidence: SponsorConfidence | null;
  matchedRules: string[];
  matchedKeywords: string[];
  matchedSponsorTerms: string[];
  matchedContextTerms: string[];
  sponsorName: string | null;
};

const sponsorIntentTerms = ["#ad", "sponsored by", "sponsored", "sponsor", "paid promotion", "paid partnership", "partnered with", "partnership with", "partnered", "partnership", "presented by", "powered by", "thanks to"];
const conversionTerms = ["use code", "creator code", "promo code", "discount", "% off", "affiliate", "referral", "ambassador", "redeem", "claim", "sign up", "download", "install", "play now", "join now", "bonus code", "deposit bonus", "free spins"];
const twitchSurfaceTerms = ["!sponsor", "!code", "!partner", "!discount", "!affiliate", "banner", "overlay", "panel", "chat command", "link below", "link in bio", "check out"];
const weakCollabTerms = ["giveaway", "drops", "collab", "collaboration"];
const contextOnlyTerms = ["roblox", "robux", "ugc", "gamepass", "private server", "obby", "simulator", "tycoon", "roleplay", "group", "join the game", "new update", "event", "casino", "slots", "poker", "betting", "sportsbook", "wager", "deposit", "bonus", "stake"];

export function scoreSponsorSignal(title: string, campaignKeywords: string[] = []): SponsorSignalScore {
  const normalizedTitle = normalize(title);
  const matchedRules: string[] = [];
  const matchedKeywords: string[] = [];
  const matchedSponsorTerms = [
    ...findTerms(normalizedTitle, sponsorIntentTerms),
    ...findTerms(normalizedTitle, conversionTerms),
    ...findTerms(normalizedTitle, twitchSurfaceTerms),
  ];
  const matchedWeakTerms = findTerms(normalizedTitle, weakCollabTerms);
  const matchedContextTerms = findTerms(normalizedTitle, contextOnlyTerms);
  let score = 0;

  const sponsorIntentMatches = findTerms(normalizedTitle, sponsorIntentTerms);
  const conversionMatches = findTerms(normalizedTitle, conversionTerms);
  const surfaceMatches = findTerms(normalizedTitle, twitchSurfaceTerms);

  if (sponsorIntentMatches.length > 0) {
    score += sponsorIntentMatches.some((term) => ["sponsored by", "presented by", "powered by", "paid partnership", "partnered with"].includes(term)) ? 55 : 45;
    matchedRules.push(...sponsorIntentMatches);
  }

  if (conversionMatches.length > 0) {
    score += conversionMatches.some((term) => ["use code", "creator code", "promo code", "bonus code", "deposit bonus"].includes(term)) ? 40 : 30;
    matchedRules.push(...conversionMatches);
  }

  if (surfaceMatches.length > 0) {
    score += surfaceMatches.some((term) => term.startsWith("!")) ? 35 : 20;
    matchedRules.push(...surfaceMatches);
  }

  if (matchedWeakTerms.length > 0) {
    score += matchedSponsorTerms.length > 0 ? 15 : 20;
    matchedRules.push(...matchedWeakTerms);
  }

  for (const keyword of campaignKeywords) {
    const normalizedKeyword = normalize(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    if (isContextOnlyTerm(normalizedKeyword)) {
      continue;
    }

    if (normalizedTitle === normalizedKeyword) {
      score += 35;
      matchedKeywords.push(keyword);
      continue;
    }

    if (normalizedTitle.includes(normalizedKeyword)) {
      score += 15;
      matchedKeywords.push(keyword);
    }
  }

  const hasStrongEvidence = matchedSponsorTerms.length > 0 || matchedKeywords.length > 0;

  if (matchedContextTerms.length > 0 && hasStrongEvidence) {
    score += 5;
  }

  if (!hasStrongEvidence && matchedWeakTerms.length === 0) {
    score = 0;
  }

  if (matchedWeakTerms.length > 0 && !hasStrongEvidence) {
    score = Math.min(score, 25);
  }

  const confidence = getConfidence(score);

  return {
    hasSignal: confidence !== null,
    score,
    confidence,
    matchedRules: [...new Set(matchedRules)],
    matchedKeywords,
    matchedSponsorTerms: [...new Set(matchedSponsorTerms)],
    matchedContextTerms,
    sponsorName: extractSponsorName(title),
  };
}

export function getConfidence(score: number): SponsorConfidence | null {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 40) {
    return "MEDIUM";
  }

  if (score >= 20) {
    return "LOW";
  }

  return null;
}

export function extractSponsorName(title: string): string | null {
  const patterns = [
    /\bsponsored\s+by\s+([a-z0-9][a-z0-9_.'-]*(?:\s+[a-z0-9][a-z0-9_.'-]*){0,3})/i,
    /\bpartnered\s+with\s+([a-z0-9][a-z0-9_.'-]*(?:\s+[a-z0-9][a-z0-9_.'-]*){0,3})/i,
    /\bpresented\s+by\s+([a-z0-9][a-z0-9_.'-]*(?:\s+[a-z0-9][a-z0-9_.'-]*){0,3})/i,
    /\bpowered\s+by\s+([a-z0-9][a-z0-9_.'-]*(?:\s+[a-z0-9][a-z0-9_.'-]*){0,3})/i,
    /\bthanks\s+to\s+([a-z0-9][a-z0-9_.'-]*(?:\s+[a-z0-9][a-z0-9_.'-]*){0,3})/i,
    /\buse\s+code\s+([a-z0-9][a-z0-9_.'-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);

    if (match?.[1]) {
      return cleanSponsorName(match[1]);
    }
  }

  return null;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findTerms(normalizedText: string, terms: string[]) {
  return terms.filter((term) => matchesTerm(normalizedText, term));
}

function matchesTerm(normalizedText: string, term: string) {
  const normalizedTerm = normalize(term);

  if (normalizedTerm.startsWith("!") || normalizedTerm.includes("%")) {
    return normalizedText.includes(normalizedTerm);
  }

  return new RegExp(`(^|\\W)${escapeRegExp(normalizedTerm)}($|\\W)`, "i").test(normalizedText);
}

function isContextOnlyTerm(normalizedKeyword: string) {
  return contextOnlyTerms.some((term) => normalize(term) === normalizedKeyword);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanSponsorName(value: string) {
  return value
    .replace(/\s+(?:for|during|tonight|today)\b.*$/i, "")
    .replace(/[.,:;!?)\]]+$/g, "")
    .trim();
}
