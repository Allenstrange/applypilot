"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Eye } from "lucide-react";
import type { Profile } from "@/lib/types";
import { buildMatchReport } from "@/lib/matchReport";
import type { SkillClass } from "@/lib/matchReport";

const CLS_LABEL: Record<SkillClass, string> = {
  hard: "Hard skill",
  soft: "Soft skill",
  other: "Domain term",
};

function Meter({ label, matched, total, testid }: { label: string; matched: number; total: number; testid: string }) {
  const pct = total ? Math.round((matched / total) * 100) : 100;
  const color = pct >= 75 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="flex-1 min-w-[9rem]" data-testid={testid}>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {matched}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/**
 * The keyword-by-keyword comparison table: how often the JD says each skill vs
 * how often the CV does, split into hard/soft meters. Missing rows lead.
 * `onAdd`/`onLocate` make rows actionable in the editor; omit them for the
 * read-only report on the Analyze page.
 */
export default function MatchReportTable({
  jd,
  keywords,
  profile,
  onAdd,
  onLocate,
  maxRows = 14,
}: {
  jd: string;
  keywords: string[];
  profile: Profile;
  onAdd?: (keyword: string) => void;
  onLocate?: (keyword: string) => void;
  maxRows?: number;
}) {
  const report = useMemo(() => buildMatchReport(jd, keywords, profile), [jd, keywords, profile]);
  const [showAll, setShowAll] = useState(false);

  if (report.total === 0) return null;
  const rows = showAll ? report.rows : report.rows.slice(0, maxRows);

  return (
    <div data-testid="match-report">
      <div className="flex gap-4 flex-wrap mb-3">
        <Meter label="Hard skills" matched={report.hard.matched} total={report.hard.total} testid="meter-hard" />
        <Meter label="Soft skills" matched={report.soft.matched} total={report.soft.total} testid="meter-soft" />
      </div>

      <div className="overflow-x-auto scrollbar">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-[var(--border)]">
              <th className="py-1.5 pr-2 font-semibold">Skill</th>
              <th className="py-1.5 px-2 font-semibold text-center" title="Times the job description mentions it">JD</th>
              <th className="py-1.5 px-2 font-semibold text-center" title="Times your CV mentions it">Your CV</th>
              <th className="py-1.5 pl-2" aria-label="Action" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const missing = r.cvCount === 0;
              return (
                <tr
                  key={r.keyword}
                  data-testid={`report-row-${r.keyword}`}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="py-1.5 pr-2">
                    <span className={`font-medium ${missing ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                      {r.keyword}
                    </span>
                    {r.emphasised ? (
                      <span
                        title="The JD repeats this 3+ times — clearly a priority"
                        className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--brand)]"
                      >
                        Priority
                      </span>
                    ) : null}
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">{CLS_LABEL[r.cls]}</span>
                  </td>
                  <td className="py-1.5 px-2 text-center tabular-nums text-slate-600 dark:text-slate-300">×{r.jdCount}</td>
                  <td className={`py-1.5 px-2 text-center tabular-nums font-semibold ${missing ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    {missing ? "0" : `×${r.cvCount}`}
                  </td>
                  <td className="py-1.5 pl-2 text-right">
                    {missing && onAdd ? (
                      <button
                        type="button"
                        onClick={() => onAdd(r.keyword)}
                        title={`Add “${r.keyword}” to your Skills section`}
                        data-testid={`add-kw-${r.keyword}`}
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-dashed border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    ) : !missing && onLocate ? (
                      <button
                        type="button"
                        onClick={() => onLocate(r.keyword)}
                        title={`Show “${r.keyword}” in the preview`}
                        data-testid={`show-kw-${r.keyword}`}
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                      >
                        <Eye className="w-3 h-3" /> Locate
                      </button>
                    ) : !missing ? (
                      <Check className="w-3.5 h-3.5 text-green-500 inline" aria-label="Covered" />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {report.rows.length > maxRows ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          data-testid="report-toggle-all"
          className="mt-2 text-[11px] font-medium text-[var(--brand)] hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${report.rows.length} keywords`}
        </button>
      ) : null}
    </div>
  );
}
