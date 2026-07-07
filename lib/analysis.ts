// ============== JOB ANALYSIS ==============
// Ported from the legacy static app (js/analysis.js).

import type {
  Profile,
  ProviderSettings,
  Analysis,
  ATSWarning,
  MatchedConcept,
  GapConcept,
} from "./types";
import { callAI, isAIConfigured } from "./ai";
import { extractKeywords } from "./keywords";

interface SemanticResult {
  matched?: MatchedConcept[];
  gaps?: GapConcept[];
  senioritySignal?: string;
  domainTags?: string[];
  overallFit?: number;
}

async function analyseJDSemantically(
  jd: string,
  profile: Profile,
  providers: ProviderSettings,
): Promise<SemanticResult> {
  const schema = {
    requiredCompetencies: [
      { concept: "string", importance: "must-have | nice-to-have", evidence: "short verbatim quote from JD" },
    ],
    matched: [
      { concept: "string", profileEvidence: "string — verbatim from profile that supports this match" },
    ],
    gaps: [
      { concept: "string", importance: "must-have | nice-to-have", suggestion: "one-sentence actionable suggestion" },
    ],
    senioritySignal: "entry | mid | senior | lead",
    domainTags: ["string"],
    overallFit: 0,
  };

  const prompt = `You are an expert technical recruiter analyzing a job description against a candidate's profile.
Extract the required competencies from the JD, then semantically match them to the candidate's profile — recognising synonyms, paraphrases, and implicit matches.

Strict instructions:
"You may only identify matches and gaps that are EVIDENT in the candidate's actual profile text. Do not infer skills the candidate did not write down."
"Return verbatim quotes from the JD (<= 15 words) as evidence for each required competency."
"For profileEvidence, quote the candidate's actual text verbatim (<= 15 words). Do not paraphrase."
"overallFit MUST be an integer percentage from 0 to 100 (e.g. 72) — never a decimal fraction like 0.72."
"Respond with valid JSON only. No prose, no markdown."

Target JSON schema:
${JSON.stringify(schema, null, 2)}

Job Description:
"""
${jd}
"""

Candidate Profile:
"""
${JSON.stringify(profile, null, 2)}
"""`;

  return (await callAI(prompt, providers)) as SemanticResult;
}

/**
 * Coerce a model-returned fit score into a clean 0–100 integer. Models sometimes
 * return a 0–1 fraction (0.4) instead of a percentage (40), which would render as
 * "0.4%". Treat anything in (0,1] as a fraction; clamp and round the rest.
 */
export function normalizeFit(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function performATSScan(profile: Profile): ATSWarning[] {
  const warnings: ATSWarning[] = [];

  if (!profile.summary)
    warnings.push({ type: "error", msg: "Missing Professional Summary section" });
  if (!profile.skills)
    warnings.push({ type: "error", msg: "Missing Skills section" });
  if (profile.experience.length === 0)
    warnings.push({ type: "error", msg: "Missing Work Experience section" });

  profile.experience.forEach((exp, i) => {
    exp.bullets
      .split("\n")
      .filter((b) => b.trim())
      .forEach((bullet) => {
        if (bullet.length > 200) {
          warnings.push({
            type: "warning",
            msg: `Role #${i + 1}: Bullet point is too long (${bullet.length} chars). Keep under 200.`,
          });
        }
      });
  });

  const allBullets = profile.experience
    .flatMap((e) => e.bullets.split("\n"))
    .join(" ");
  const hasMetrics = /\d+%|\d+\s*(users|tickets|systems|devices|projects)/i.test(
    allBullets,
  );
  if (!hasMetrics) {
    warnings.push({
      type: "warning",
      msg: 'No quantifiable metrics found. Add numbers like "reduced tickets by 20%" or "supported 150 users".',
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      type: "success",
      msg: "No major ATS issues detected. Your profile looks good!",
    });
  }
  return warnings;
}

export interface AnalyseInput {
  company: string;
  title: string;
  location: string;
  url: string;
  jd: string;
}

/** Run the full analysis: semantic match (or keyword fallback) + ATS scan. */
export async function analyseJob(
  input: AnalyseInput,
  profile: Profile,
  providers: ProviderSettings,
): Promise<Analysis> {
  let jdKeywords: string[] = [];
  let matched: MatchedConcept[] = [];
  let missing: string[] = [];
  let gaps: GapConcept[] = [];
  let senioritySignal = "";
  let domainTags: string[] = [];
  let overallFit = 0;
  let isSemantic = false;

  const runFallback = () => {
    jdKeywords = extractKeywords(input.jd);
    const profileKeywords = extractKeywords(
      profile.skills +
        " " +
        profile.experience.map((e) => e.tools + " " + e.bullets).join(" "),
    );
    matched = jdKeywords
      .filter((k) => profileKeywords.includes(k))
      .map((concept) => ({ concept }));
    missing = jdKeywords.filter((k) => !profileKeywords.includes(k));
  };

  if (isAIConfigured(providers)) {
    try {
      const r = await analyseJDSemantically(input.jd, profile, providers);
      overallFit = normalizeFit(r.overallFit);
      senioritySignal = r.senioritySignal ?? "";
      domainTags = r.domainTags ?? [];
      matched = r.matched ?? [];
      gaps = r.gaps ?? [];
      // Gaps count too — otherwise the live match rate reads 100% while known
      // gaps remain, contradicting the match report right next to it.
      jdKeywords = [
        ...new Set([...matched.map((m) => m.concept), ...gaps.map((g) => g.concept)]),
      ];
      isSemantic = true;
    } catch {
      runFallback();
    }
  } else {
    runFallback();
  }

  return {
    ...input,
    jdKeywords,
    matched,
    missing,
    gaps,
    overallFit,
    senioritySignal,
    domainTags,
    atsWarnings: performATSScan(profile),
    isSemantic,
  };
}
