"use client";

import { useMemo } from "react";
import { Lightbulb, MapPin, BadgeCheck, Clock, Layers, CheckCircle2 } from "lucide-react";
import { buildInsights } from "@/lib/resumeInsights";
import type { Profile } from "@/lib/types";

/**
 * Free, local "Insights" panel (Rezi-style Agent Insights): facts we can infer
 * about the candidate plus an itemised, per-role issues list. No AI/network —
 * pure heuristics over the profile, so it costs nothing and updates live.
 */
export default function ResumeInsights({ profile }: { profile: Profile }) {
  const { facts, roleIssues, documentIssues } = useMemo(() => buildInsights(profile), [profile]);
  const totalIssues = roleIssues.reduce((n, r) => n + r.issues.length, 0) + documentIssues.length;

  return (
    <div className="card rounded-xl p-4 mb-3" data-testid="resume-insights">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Lightbulb className="w-4 h-4 text-[var(--brand)]" /> Insights
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Local · no AI</span>
      </div>

      {/* What we know */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Fact icon={MapPin} label="Location" value={facts.location} />
        <Fact icon={BadgeCheck} label="Seniority" value={facts.seniority} />
        <Fact icon={Clock} label="Experience" value={facts.yearsExperience != null ? `~${facts.yearsExperience} yrs` : "—"} />
        <Fact icon={Layers} label="Roles" value={String(facts.roleCount)} />
      </div>

      {totalIssues === 0 ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> No structural issues detected.
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            To fix ({totalIssues})
          </div>
          {documentIssues.length ? (
            <div>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Document</div>
              <ul className="space-y-1">
                {documentIssues.map((iss, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-amber-500 shrink-0">→</span>
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {roleIssues.map((r) => (
            <div key={r.expIndex}>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 truncate">{r.roleLabel}</div>
              <ul className="space-y-1">
                {r.issues.map((iss, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-amber-500 shrink-0">→</span>
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{value}</div>
    </div>
  );
}
