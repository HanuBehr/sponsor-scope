export type SponsorConfidence = "LOW" | "MEDIUM" | "HIGH";

export type SponsorSignalScore = {
  hasSignal: boolean;
  score: number;
  confidence: SponsorConfidence | null;
  matchedRules: string[];
  matchedKeywords: string[];
  sponsorName: string | null;
};

type Rule = {
  name: string;
  points: number;
  pattern: RegExp;
};

const rules: Rule[] = [
  { name: "sponsored", points: 50, pattern: /\bsponsored(?:\s+by)?\b/i },
  { name: "partnership", points: 45, pattern: /\b(?:partnered\s+with|partnership)\b/i },
  { name: "ad", points: 40, pattern: /(?:#ad\b|\bad\b)/i },
  { name: "code", points: 35, pattern: /\b(?:use\s+code|creator\s+code)\b/i },
  { name: "discount", points: 30, pattern: /(?:\bdiscount\b|\b\d{1,3}\s*%\s*off\b)/i },
  { name: "giveaway", points: 20, pattern: /\bgiveaway\b/i },
  { name: "thanks", points: 20, pattern: /\bthanks\s+to\b/i },
];

export function scoreSponsorSignal(title: string, campaignKeywords: string[] = []): SponsorSignalScore {
  const normalizedTitle = normalize(title);
  const matchedRules: string[] = [];
  const matchedKeywords: string[] = [];
  let score = 0;

  for (const rule of rules) {
    if (rule.pattern.test(title)) {
      score += rule.points;
      matchedRules.push(rule.name);
    }
  }

  for (const keyword of campaignKeywords) {
    const normalizedKeyword = normalize(keyword);

    if (!normalizedKeyword) {
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

  const confidence = getConfidence(score);

  return {
    hasSignal: confidence !== null,
    score,
    confidence,
    matchedRules,
    matchedKeywords,
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

function cleanSponsorName(value: string) {
  return value
    .replace(/\s+(?:for|during|tonight|today)\b.*$/i, "")
    .replace(/[.,:;!?)\]]+$/g, "")
    .trim();
}
