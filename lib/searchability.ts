// ============== SEARCHABILITY CHECKS (no AI, no network) ==============
// Can a recruiter actually *find and read* this CV once it's inside an ATS?
// Pass/fail checks complementing performATSScan (which covers sections,
// bullet length, and metrics): contact fields, job-title match, dates, length.

import type { Profile, Analysis } from "./types";

export interface SearchabilityCheck {
  id: string;
  ok: boolean;
  /** What we checked, phrased as the passing state ("Email address present"). */
  label: string;
  /** Shown when the check fails: what to do about it. */
  fix: string;
}

const EMAIL_RE = /\S+@\S+\.\S+/;
const PHONE_RE = /[\d][\d\s\-().+]{6,}/;

function wordCount(p: Profile): number {
  return [
    p.summary, p.skills, p.certs,
    ...p.experience.map((e) => `${e.role} ${e.bullets} ${e.tools}`),
    ...p.education.map((e) => `${e.degree} ${e.institution}`),
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Does the CV mention the JD's job title (or most of its significant words)? */
function titleMatches(profile: Profile, jobTitle: string): boolean {
  if (!jobTitle.trim()) return true;
  const hay = `${profile.title} ${profile.summary}`.toLowerCase();
  const words = jobTitle.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (words.length === 0) return true;
  const hit = words.filter((w) => hay.includes(w)).length;
  return hit / words.length >= 0.6;
}

export function checkSearchability(profile: Profile, analysis?: Analysis | null): SearchabilityCheck[] {
  const checks: SearchabilityCheck[] = [];
  const words = wordCount(profile);

  checks.push({
    id: "email",
    ok: EMAIL_RE.test(profile.email),
    label: "Email address present",
    fix: "Recruiters can't contact you — add an email to your header.",
  });
  checks.push({
    id: "phone",
    ok: PHONE_RE.test(profile.phone),
    label: "Phone number present",
    fix: "Some ATS screening requires a phone number — add one.",
  });
  checks.push({
    id: "location",
    ok: !!profile.location.trim(),
    label: "Location listed",
    fix: "Location filters are common in ATS searches — add your city or region.",
  });
  if (analysis?.title) {
    checks.push({
      id: "title",
      ok: titleMatches(profile, analysis.title),
      label: `Job title “${analysis.title}” reflected in your headline or summary`,
      fix: "Recruiters search by the posting's title — echo it in your professional title or summary.",
    });
  }
  checks.push({
    id: "dates",
    ok: profile.experience.length > 0 && profile.experience.every((e) => e.start.trim()),
    label: "Every role has dates",
    fix: "ATS timelines break without dates — add a start (and end) date to each role.",
  });
  checks.push({
    id: "length",
    ok: words >= 250 && words <= 1000,
    label: `Word count in the readable range (${words} words)`,
    fix:
      words < 250
        ? "Under ~250 words reads as a stub — expand your bullets with specifics."
        : "Over ~1000 words dilutes keyword density — trim to the strongest material.",
  });

  return checks;
}
