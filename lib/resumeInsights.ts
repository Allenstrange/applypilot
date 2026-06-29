// ============== LOCAL RÉSUMÉ INSIGHTS (no AI, no network) ==============
// Rezi-style "Agent Insights": a structured, itemised read of a résumé — facts
// we can infer about the candidate, plus concrete per-role issues. All heuristic
// and instant, so it's free (Track A) and complements the AI Resume Score.

import type { Profile } from "./types";

export interface ProfileFacts {
  location: string;
  title: string;
  seniority: string;
  yearsExperience: number | null;
  roleCount: number;
}

export interface RoleIssue {
  roleLabel: string;
  expIndex: number;
  issues: string[];
}

export interface ResumeInsights {
  facts: ProfileFacts;
  roleIssues: RoleIssue[];
  /** Document-level notes (word count, missing sections, etc.). */
  documentIssues: string[];
}

const MONTHS =
  "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)";

function bulletList(bullets: string): string[] {
  return (bullets || "").split("\n").map((b) => b.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean);
}

/** Classify a single date string into a comparable "shape" so we can spot mixes. */
function dateShape(s: string): string | null {
  const t = (s || "").trim();
  if (!t) return null;
  if (/^(present|current|now)$/i.test(t)) return "word";
  if (new RegExp(`^${MONTHS}\\.?\\s*\\d{4}$`, "i").test(t)) return "Mon YYYY";
  if (/^\d{1,2}[\/-]\d{4}$/.test(t)) return "MM/YYYY";
  if (/^\d{4}[\/-]\d{1,2}$/.test(t)) return "YYYY/MM";
  if (/^\d{4}$/.test(t)) return "YYYY";
  return "other";
}

function inferYears(p: Profile): number | null {
  const years: number[] = [];
  for (const e of p.experience) {
    for (const d of [e.start, e.end]) {
      const m = (d || "").match(/\d{4}/);
      if (m) years.push(Number(m[0]));
    }
  }
  if (years.length < 2) return null;
  const span = Math.max(...years) - Math.min(...years);
  return span > 0 && span < 60 ? span : null;
}

function inferSeniority(p: Profile, years: number | null): string {
  const titles = (p.title + " " + p.experience.map((e) => e.role).join(" ")).toLowerCase();
  if (/(chief|vp|vice president|head of|director|principal)/.test(titles)) return "Leadership";
  if (/(senior|lead|staff|manager)/.test(titles)) return "Senior";
  if (/(junior|graduate|intern|trainee|entry)/.test(titles)) return "Entry level";
  if (years != null) {
    if (years >= 8) return "Senior";
    if (years >= 3) return "Mid level";
    return "Entry level";
  }
  return "Unspecified";
}

/** Build the full local insights for a profile. Pure, no side effects. */
export function buildInsights(p: Profile): ResumeInsights {
  const years = inferYears(p);
  const facts: ProfileFacts = {
    location: p.location?.trim() || "—",
    title: p.title?.trim() || "—",
    seniority: inferSeniority(p, years),
    yearsExperience: years,
    roleCount: p.experience.length,
  };

  const roleIssues: RoleIssue[] = [];
  for (let i = 0; i < p.experience.length; i++) {
    const e = p.experience[i];
    const bullets = bulletList(e.bullets);
    const issues: string[] = [];

    if (bullets.length === 0) issues.push("No bullet points yet");
    else if (bullets.length < 3) issues.push(`Only ${bullets.length} bullet${bullets.length === 1 ? "" : "s"} — aim for 3–5`);
    else if (bullets.length > 6) issues.push(`${bullets.length} bullets — trim to your strongest 4–6`);

    // date format consistency / validity
    const shapes = [e.start, e.end].map(dateShape).filter(Boolean) as string[];
    if (!e.start?.trim() || !e.end?.trim()) issues.push("Missing start or end date");
    else if (shapes.includes("other")) issues.push("Unrecognised date format");
    else if (new Set(shapes).size > 1) issues.push(`Inconsistent date format (${shapes.join(" vs ")})`);

    // missing metrics per bullet
    const noMetric = bullets
      .map((b, idx) => (/\d/.test(b) ? -1 : idx + 1))
      .filter((n) => n > 0);
    if (bullets.length && noMetric.length === bullets.length) {
      issues.push("No bullets are quantified — add numbers, %, or scale");
    } else if (noMetric.length) {
      issues.push(`Missing a metric in bullet ${noMetric.map((n) => `#${n}`).join(", ")}`);
    }

    if (!e.role?.trim()) issues.push("Missing job title");

    if (issues.length) {
      roleIssues.push({
        roleLabel: [e.role, e.company].filter(Boolean).join(" — ") || `Role ${i + 1}`,
        expIndex: i,
        issues,
      });
    }
  }

  const documentIssues: string[] = [];
  if (!p.summary?.trim()) documentIssues.push("No professional summary");
  if (!p.skills?.trim()) documentIssues.push("No skills section");
  if (p.experience.length === 0) documentIssues.push("No work experience added");

  const wordCount = [
    p.summary,
    p.skills,
    p.experience.map((e) => e.bullets).join(" "),
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (wordCount > 0 && wordCount < 200)
    documentIssues.push(`Quite short (~${wordCount} words) — a 1-page CV is usually 300–600`);
  else if (wordCount > 850)
    documentIssues.push(`Long (~${wordCount} words) — tighten toward 1–2 pages`);

  return { facts, roleIssues, documentIssues };
}
