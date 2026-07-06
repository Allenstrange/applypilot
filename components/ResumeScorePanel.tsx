"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Lightbulb, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { scoreResume } from "@/lib/resumeScore";

const SEV = {
  error: { Icon: AlertCircle, cls: "text-red-600" },
  warning: { Icon: AlertTriangle, cls: "text-amber-600" },
  tip: { Icon: Lightbulb, cls: "text-violet-600" },
} as const;

export default function ResumeScorePanel({ profile }: { profile: Profile }) {
  const { overall, categories, issues } = scoreResume(profile);
  const color = overall >= 80 ? "#16a34a" : overall >= 55 ? "#d97706" : "#dc2626";
  // Click a category bar to see only its fixes; click again (or ✕) to clear.
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const shown = activeCat ? issues.filter((i) => i.category === activeCat) : issues;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="7" />
            <circle
              cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - overall / 100)}
              transform="rotate(-90 32 32)" strokeLinecap="round" className="progress-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color }}>
            {overall}
          </div>
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">Resume Score</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {overall >= 80 ? "Strong — minor tweaks only" : overall >= 55 ? "Decent — a few things to fix" : "Needs work — see suggestions"}
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {categories.map((c) => {
          const catIssues = issues.filter((i) => i.category === c.label).length;
          const active = activeCat === c.label;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => setActiveCat(active ? null : catIssues ? c.label : null)}
              disabled={!catIssues && !active}
              data-testid={`score-cat-${c.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              title={catIssues ? `Show the ${catIssues} fix${catIssues === 1 ? "" : "es"} for ${c.label}` : "Nothing to fix here"}
              className={`block w-full text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                active
                  ? "bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                  : catIssues
                    ? "hover:bg-[var(--surface-2)] cursor-pointer"
                    : "cursor-default"
              }`}
            >
              <div className="flex justify-between text-xs mb-0.5">
                <span className={active ? "font-semibold text-[var(--brand)]" : "text-slate-500 dark:text-slate-400"}>
                  {c.label}
                  {catIssues ? (
                    <span className={`ml-1.5 tabular-nums ${active ? "text-[var(--brand)]" : "text-amber-600 dark:text-amber-400"}`}>
                      {catIssues} fix{catIssues === 1 ? "" : "es"}
                    </span>
                  ) : null}
                </span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">{c.score}/{c.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${(c.score / c.max) * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {activeCat ? `${activeCat} (${shown.length})` : `Suggestions (${issues.length})`}
        </span>
        {activeCat ? (
          <button
            type="button"
            onClick={() => setActiveCat(null)}
            data-testid="score-filter-clear"
            className="text-[11px] text-[var(--brand)] hover:underline inline-flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> Show all
          </button>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <div className="text-sm text-green-600 dark:text-green-400">Nothing to fix — looks great!</div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar pr-1">
          {shown.map((issue, i) => {
            const { Icon, cls } = SEV[issue.severity];
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cls}`} />
                <span className="text-slate-700 dark:text-slate-200">
                  {issue.message}
                  {issue.where ? <span className="text-slate-500 dark:text-slate-400"> · {issue.where}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
