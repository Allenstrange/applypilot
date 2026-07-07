"use client";

import { CheckCircle2, XCircle, Radar } from "lucide-react";
import type { Profile, Analysis } from "@/lib/types";
import { checkSearchability } from "@/lib/searchability";
import { detectATS } from "@/lib/atsDetect";

/**
 * "Will a recruiter find and read this?" — pass/fail searchability checks,
 * plus system-specific tips when the job URL reveals which ATS is behind it.
 */
export default function SearchabilityPanel({
  profile,
  analysis,
}: {
  profile: Profile;
  analysis: Analysis;
}) {
  const checks = checkSearchability(profile, analysis);
  const passed = checks.filter((c) => c.ok).length;
  const ats = detectATS(analysis.url);

  return (
    <div className="card rounded-xl p-5" data-testid="searchability-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Searchability</h3>
        <span
          className={`text-xs font-semibold tabular-nums ${
            passed === checks.length ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {passed}/{checks.length} checks passed
        </span>
      </div>

      <ul className="space-y-2 mb-1">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm" data-testid={`search-check-${c.id}`}>
            {c.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-500" aria-label="Pass" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" aria-label="Fail" />
            )}
            <span className="text-slate-700 dark:text-slate-200">
              {c.label}
              {!c.ok ? (
                <span className="block text-xs text-slate-500 dark:text-slate-400">{c.fix}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {ats ? (
        <div
          className="mt-4 rounded-lg border border-[var(--brand)]/30 bg-[color-mix(in_srgb,var(--brand)_6%,transparent)] p-3"
          data-testid="ats-detected"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] mb-1.5">
            <Radar className="w-3.5 h-3.5" /> ATS detected: {ats.name}
          </div>
          <ul className="space-y-1">
            {ats.tips.map((t, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-1.5">
                <span className="text-[var(--brand)]" aria-hidden>•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
