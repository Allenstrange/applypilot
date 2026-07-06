// ============== RESUME SCORE & LIVE FEEDBACK ==============
// Heuristic, no AI required. Scores a resume 0-100 across five categories and
// surfaces specific, actionable issues (weak verbs, missing metrics, etc.).

import type { Profile, ResumeScore, ScoreIssue, ScoreCategory } from "./types";

const STRONG_VERBS = [
  "led", "built", "delivered", "designed", "developed", "launched", "created",
  "managed", "improved", "increased", "reduced", "drove", "owned", "shipped",
  "automated", "implemented", "optimized", "optimised", "streamlined", "resolved",
  "negotiated", "spearheaded", "architected", "migrated", "scaled", "mentored",
  "coordinated", "analysed", "analyzed", "configured", "deployed", "supported",
  "troubleshot", "administered", "maintained", "established", "achieved",
];

const FILLER_PHRASES = [
  "responsible for", "duties included", "tasked with", "in charge of",
  "worked on", "helped with", "assisted with", "various", "etc",
  "team player", "hard worker", "go-getter", "results-driven", "detail-oriented",
];

const METRIC_RE = /\d+%|\$\s?\d|£\s?\d|\b\d{2,}\b|\b\d+\s*(users|customers|clients|tickets|projects|people|hours|days|weeks|k|m|million)\b/i;

function bullets(profile: Profile): { text: string; where: string }[] {
  const out: { text: string; where: string }[] = [];
  profile.experience.forEach((exp, i) => {
    exp.bullets
      .split("\n")
      .map((b) => b.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
      .forEach((text, j) =>
        out.push({ text, where: `${exp.role || `Role ${i + 1}`} · bullet ${j + 1}` }),
      );
  });
  return out;
}

export function scoreResume(profile: Profile): ResumeScore {
  const issues: ScoreIssue[] = [];
  const categories: ScoreCategory[] = [];

  // 1. Contact & basics (15)
  let contact = 0;
  const basics: [keyof Profile, string][] = [
    ["name", "full name"],
    ["title", "professional title"],
    ["email", "email"],
    ["phone", "phone"],
    ["location", "location"],
  ];
  basics.forEach(([key, label]) => {
    if ((profile[key] as string)?.trim()) contact += 3;
    else issues.push({ severity: "warning", message: `Add your ${label}`, where: "Header", category: "Contact & basics" });
  });
  categories.push({ label: "Contact & basics", score: contact, max: 15 });

  // 2. Summary (15)
  let summary = 0;
  const sumLen = profile.summary.trim().length;
  if (sumLen === 0) {
    issues.push({ severity: "error", message: "Add a professional summary", where: "Summary", category: "Summary" });
  } else if (sumLen < 150) {
    summary = 8;
    issues.push({ severity: "tip", message: "Summary is short — aim for 2-4 punchy sentences", where: "Summary", category: "Summary" });
  } else if (sumLen > 700) {
    summary = 11;
    issues.push({ severity: "tip", message: "Summary is long — tighten it to the essentials", where: "Summary", category: "Summary" });
  } else {
    summary = 15;
  }
  categories.push({ label: "Summary", score: summary, max: 15 });

  // 3. Skills (15)
  let skills = 0;
  const skillCount = profile.skills.split(",").map((s) => s.trim()).filter(Boolean).length;
  if (skillCount === 0) {
    issues.push({ severity: "error", message: "Add a skills section", where: "Skills", category: "Skills" });
  } else if (skillCount < 6) {
    skills = 8;
    issues.push({ severity: "tip", message: `Only ${skillCount} skills listed — add more relevant tools/skills`, where: "Skills", category: "Skills" });
  } else {
    skills = 15;
  }
  categories.push({ label: "Skills", score: skills, max: 15 });

  // 4. Experience structure (25)
  let exp = 0;
  const allBullets = bullets(profile);
  if (profile.experience.length === 0) {
    issues.push({ severity: "error", message: "Add at least one work experience entry", where: "Experience", category: "Experience" });
  } else {
    exp += 10;
    if (allBullets.length >= profile.experience.length * 2) exp += 8;
    else issues.push({ severity: "warning", message: "Add 2-4 bullet points per role", where: "Experience", category: "Experience" });
    const hasDates = profile.experience.every((e) => e.start.trim());
    if (hasDates) exp += 7;
    else issues.push({ severity: "tip", message: "Add start/end dates to every role", where: "Experience", category: "Experience" });
  }
  categories.push({ label: "Experience", score: exp, max: 25 });

  // 5. Bullet quality (20): metrics, strong verbs, no filler, length
  let quality = 0;
  if (allBullets.length > 0) {
    const withMetric = allBullets.filter((b) => METRIC_RE.test(b.text));
    const metricRatio = withMetric.length / allBullets.length;
    quality += Math.round(metricRatio * 10);
    if (metricRatio < 0.5) {
      const example = allBullets.find((b) => !METRIC_RE.test(b.text));
      issues.push({
        severity: "warning",
        message: "Quantify more bullets — add numbers, %, or scale",
        where: example?.where,
        category: "Bullet quality",
      });
    }

    let strongCount = 0;
    allBullets.forEach((b) => {
      const first = b.text.toLowerCase().split(/\s+/)[0] ?? "";
      if (STRONG_VERBS.includes(first)) strongCount++;
      const lower = b.text.toLowerCase();
      const filler = FILLER_PHRASES.find((f) => lower.includes(f));
      if (filler) {
        issues.push({ severity: "tip", message: `Replace filler "${filler}" with a strong action verb`, where: b.where, category: "Bullet quality" });
      }
      if (b.text.length > 220) {
        issues.push({ severity: "tip", message: "Bullet is long — split or trim it", where: b.where, category: "Bullet quality" });
      }
    });
    const verbRatio = strongCount / allBullets.length;
    quality += Math.round(verbRatio * 10);
    if (verbRatio < 0.5) {
      issues.push({ severity: "warning", message: "Start more bullets with strong action verbs (Led, Built, Reduced…)", where: "Experience", category: "Bullet quality" });
    }
  }
  categories.push({ label: "Bullet quality", score: quality, max: 20 });

  // 6. Education (10)
  let edu = 0;
  if (profile.education.length > 0) edu = 10;
  else issues.push({ severity: "tip", message: "Add your education", where: "Education", category: "Education" });
  categories.push({ label: "Education", score: edu, max: 10 });

  const overall = categories.reduce((sum, c) => sum + c.score, 0);

  // Order issues by severity for display.
  const rank = { error: 0, warning: 1, tip: 2 } as const;
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return { overall, categories, issues };
}
