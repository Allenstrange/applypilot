// ============== LOCAL WRITING CHECKS (no AI, no network) ==============
// Per-bullet, real-time résumé writing feedback in the spirit of Rezi's
// content checks: passive voice, first-person, weak openers, filler,
// missing metrics, length and repetition. All heuristic and instant.

export type WritingSeverity = "warn" | "tip";

export interface WritingIssue {
  id: string;
  label: string;
  detail: string;
  severity: WritingSeverity;
}

const STRONG_VERBS = new Set([
  "led", "built", "delivered", "designed", "developed", "launched", "created",
  "managed", "improved", "increased", "reduced", "drove", "owned", "shipped",
  "automated", "implemented", "optimized", "optimised", "streamlined", "resolved",
  "negotiated", "spearheaded", "architected", "migrated", "scaled", "mentored",
  "coordinated", "analysed", "analyzed", "configured", "deployed", "supported",
  "troubleshot", "administered", "maintained", "established", "achieved",
  "cut", "grew", "saved", "won", "ran", "founded", "launched", "rolled",
]);

const FILLER = [
  "responsible for", "duties included", "tasked with", "in charge of",
  "worked on", "helped with", "assisted with", "various", "team player",
  "hard worker", "go-getter", "results-driven", "detail-oriented",
  "self-starter", "think outside the box", "synergy",
];

const FIRST_PERSON_RE = /\b(i|me|my|myself|mine)\b/i;
// "was responsible", "were managed", "is developed", "been involved"
const PASSIVE_RE = /\b(?:was|were|been|being|is|are|am|be)\b\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/i;
const HAS_NUMBER_RE = /\d/;

const STOP = new Set([
  "with", "from", "that", "this", "their", "they", "them", "into", "over",
  "across", "while", "using", "which", "were", "have", "been", "also", "team",
]);

/**
 * Analyse a single résumé bullet and return up to three prioritised writing
 * issues (warnings before tips). Returns an empty array for clean bullets.
 */
export function checkBullet(text: string): WritingIssue[] {
  const t = (text || "").replace(/^\s*[-•]\s*/, "").trim();
  if (!t) return [];

  const issues: WritingIssue[] = [];
  const words = t.split(/\s+/);
  const lower = t.toLowerCase();

  if (FIRST_PERSON_RE.test(t)) {
    issues.push({
      id: "first-person",
      label: "First person",
      detail: "Résumés drop “I/my”. Start with an action verb instead.",
      severity: "warn",
    });
  }

  if (PASSIVE_RE.test(t)) {
    issues.push({
      id: "passive",
      label: "Passive voice",
      detail: "Rewrite in active voice — e.g. “Led the rollout”, not “was responsible for the rollout”.",
      severity: "warn",
    });
  }

  const filler = FILLER.find((f) => lower.includes(f));
  if (filler) {
    issues.push({
      id: "filler",
      label: `“${filler}”`,
      detail: `Replace the filler “${filler}” with a concrete achievement.`,
      severity: "warn",
    });
  }

  const first = (words[0] || "").toLowerCase().replace(/[^a-z]/g, "");
  if (first && !STRONG_VERBS.has(first) && !FIRST_PERSON_RE.test(first)) {
    issues.push({
      id: "weak-verb",
      label: "Weak opener",
      detail: "Open with a strong action verb (Led, Built, Reduced, Automated…).",
      severity: "tip",
    });
  }

  if (!HAS_NUMBER_RE.test(t)) {
    issues.push({
      id: "no-metric",
      label: "No metric",
      detail: "Quantify the impact — add a number, %, time saved, or scale.",
      severity: "tip",
    });
  }

  if (words.length > 32) {
    issues.push({
      id: "too-long",
      label: "Too long",
      detail: `${words.length} words — tighten to one line (~20–30 words).`,
      severity: "tip",
    });
  }

  // repeated content word within the bullet
  const seen = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^a-z]/g, "");
    if (k.length < 5 || STOP.has(k)) continue;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const repeated = [...seen.entries()].find(([, n]) => n > 1)?.[0];
  if (repeated) {
    issues.push({
      id: "repetition",
      label: "Repeated word",
      detail: `“${repeated}” appears more than once — vary your wording.`,
      severity: "tip",
    });
  }

  // warnings first, capped to keep the UI calm
  issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "warn" ? -1 : 1));
  return issues.slice(0, 3);
}
