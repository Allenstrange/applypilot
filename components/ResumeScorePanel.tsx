"use client";

import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
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

      <div className="space-y-2 mb-4">
        {categories.map((c) => (
          <div key={c.label}>
            <div className="flex justify-between text-xs text-slate-500 mb-0.5 dark:text-slate-400">
              <span>{c.label}</span>
              <span>{c.score}/{c.max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${(c.score / c.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 dark:text-slate-500">
        Suggestions ({issues.length})
      </div>
      {issues.length === 0 ? (
        <div className="text-sm text-green-600 dark:text-green-400">Nothing to fix — looks great!</div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar pr-1">
          {issues.map((issue, i) => {
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
