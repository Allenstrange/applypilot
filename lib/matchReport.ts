// ============== MATCH REPORT (no AI, no network) ==============
// The centrepiece comparison: for every keyword that matters in the JD, how
// often does the JD say it vs how often does the CV say it? Also splits skills
// into hard vs soft, because ATS filters weigh hard skills far more heavily.

import type { Profile } from "./types";
import { extractKeywords, countOccurrences, categoryOf } from "./keywordExtract";
import type { KeywordCategory } from "./keywordExtract";

export type SkillClass = "hard" | "soft" | "other";

export interface MatchRow {
  keyword: string;
  category: KeywordCategory;
  cls: SkillClass;
  /** Occurrences in the job description. */
  jdCount: number;
  /** Occurrences in the CV. */
  cvCount: number;
  /** The JD repeats it 3+ times — clearly a priority. */
  emphasised: boolean;
}

export interface MatchReport {
  /** Missing rows first (highest JD count first), then covered rows. */
  rows: MatchRow[];
  hard: { matched: number; total: number };
  soft: { matched: number; total: number };
  matched: number;
  total: number;
}

/** Curated soft skills — the "General" category also holds unknown domain terms. */
const SOFT_SKILLS = new Set([
  "communication", "leadership", "stakeholder management", "customer service",
  "collaboration", "problem solving", "mentoring", "teamwork", "presentation",
  "negotiation", "time management", "adaptability", "prioritisation", "prioritization",
]);

function classify(keyword: string, category: KeywordCategory): SkillClass {
  if (SOFT_SKILLS.has(keyword.toLowerCase())) return "soft";
  if (category !== "General") return "hard";
  return "other";
}

/** Flatten a profile into one searchable text blob (same fields the ATS sees). */
export function profileText(p: Profile): string {
  return [
    p.name, p.title, p.location, p.summary, p.skills, p.certs,
    ...p.experience.map((e) => `${e.role} ${e.company} ${e.tools} ${e.bullets}`),
    ...p.education.map((e) => `${e.degree} ${e.institution}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * The same substring match (over the same fields) the live editor score uses,
 * so persisted history snapshots agree with the number the user watched climb.
 */
export function quickMatchScore(profile: Profile, jdKeywords: string[]): number {
  if (!jdKeywords.length) return 0;
  const text = (
    profile.summary +
    " " +
    profile.skills +
    " " +
    profile.experience.map((e) => e.tools + " " + e.bullets).join(" ")
  ).toLowerCase();
  const matched = jdKeywords.filter((k) => text.includes(k.toLowerCase()));
  return Math.round((matched.length / jdKeywords.length) * 100);
}

/**
 * Build the keyword-by-keyword comparison between a JD and a CV.
 * Uses the local extractor for counts/categories, then folds in any AI-picked
 * keywords (`analysis.jdKeywords`) the extractor missed so both signals agree.
 */
export function buildMatchReport(
  jdText: string,
  aiKeywords: string[],
  profile: Profile,
): MatchReport {
  const jd = (jdText || "").toLowerCase();
  const cv = profileText(profile);

  const byKeyword = new Map<string, MatchRow>();
  for (const k of extractKeywords(jdText, 30)) {
    byKeyword.set(k.token.toLowerCase(), {
      keyword: k.token,
      category: k.category,
      cls: classify(k.token, k.category),
      jdCount: k.count,
      cvCount: countOccurrences(cv, k.token),
      emphasised: k.count >= 3,
    });
  }
  for (const raw of aiKeywords) {
    const key = raw.trim();
    if (!key || byKeyword.has(key.toLowerCase())) continue;
    const jdCount = Math.max(1, countOccurrences(jd, key));
    const category = categoryOf(key) ?? "General";
    byKeyword.set(key.toLowerCase(), {
      keyword: key,
      category,
      cls: classify(key, category),
      jdCount,
      cvCount: countOccurrences(cv, key),
      emphasised: jdCount >= 3,
    });
  }

  const rows = Array.from(byKeyword.values()).sort((a, b) => {
    const aMissing = a.cvCount === 0 ? 0 : 1;
    const bMissing = b.cvCount === 0 ? 0 : 1;
    return aMissing - bMissing || b.jdCount - a.jdCount || a.keyword.localeCompare(b.keyword);
  });

  const tally = (cls: SkillClass) => {
    const of = rows.filter((r) => r.cls === cls);
    return { matched: of.filter((r) => r.cvCount > 0).length, total: of.length };
  };

  return {
    rows,
    hard: tally("hard"),
    soft: tally("soft"),
    matched: rows.filter((r) => r.cvCount > 0).length,
    total: rows.length,
  };
}
