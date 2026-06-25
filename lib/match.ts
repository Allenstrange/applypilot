// ============== JOB MATCHER ==============
// Fast go/no-go scoring of one or many job postings against the master profile.
// Lighter than the full Job Analysis — designed for triaging a batch of roles.

import type { Profile, ProviderSettings, JobMatch, MatchVerdict } from "./types";
import { callAI } from "./ai";

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function verdictFromFit(fit: number): MatchVerdict {
  if (fit >= 75) return "strong";
  if (fit >= 55) return "good";
  if (fit >= 35) return "stretch";
  return "weak";
}

export async function matchJob(
  profile: Profile,
  jobText: string,
  providers: ProviderSettings,
): Promise<Omit<JobMatch, "id">> {
  const prompt = `You are a career advisor scoring how well a candidate fits a job posting.

Candidate profile:
"""
${JSON.stringify(profile, null, 2)}
"""

Job posting (may begin with a title/company line, then the description):
"""
${jobText}
"""

Instructions:
- Extract the company and job title from the posting. If absent, use "Unknown".
- Score overall fit 0-100 based ONLY on evidence in the candidate profile. Do not assume skills not written down.
- Give 2-4 concrete reasons to apply (genuine strengths that match the role).
- Give 2-4 gaps (important requirements the profile does not clearly evidence).
- Respond with valid JSON only. No prose, no markdown.

JSON schema:
{
  "company": "string",
  "title": "string",
  "fit": 0,
  "reasons": ["..."],
  "gaps": ["..."]
}`;

  const r = (await callAI(prompt, providers)) as {
    company?: string;
    title?: string;
    fit?: number;
    reasons?: unknown;
    gaps?: unknown;
  };
  const fit = Math.max(0, Math.min(100, Math.round(Number(r.fit) || 0)));
  return {
    company: String(r.company || "Unknown").trim() || "Unknown",
    title: String(r.title || "Unknown").trim() || "Unknown",
    fit,
    verdict: verdictFromFit(fit),
    reasons: asArray(r.reasons),
    gaps: asArray(r.gaps),
    jd: jobText,
  };
}
