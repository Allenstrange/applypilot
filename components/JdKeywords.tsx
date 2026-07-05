"use client";

import { useDeferredValue, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { extractKeywords, groupByCategory } from "@/lib/keywordExtract";
import { copyToClipboard } from "@/lib/download";
import { toast } from "@/lib/toast";

const CATEGORY_DOT: Record<string, string> = {
  Languages: "#7c3aed",
  "Frameworks & Libraries": "#2563eb",
  Cloud: "#0891b2",
  Data: "#16a34a",
  Infrastructure: "#d97706",
  Tools: "#db2777",
  Methods: "#9333ea",
  General: "#64748b",
};

/**
 * Live, AI-free preview of the keywords an ATS will scan for, extracted from
 * the pasted job description. Recompute is deferred so it never blocks typing.
 */
export default function JdKeywords({ jd }: { jd: string }) {
  const deferred = useDeferredValue(jd);
  const keywords = useMemo(() => extractKeywords(deferred), [deferred]);
  const groups = useMemo(() => groupByCategory(keywords), [keywords]);

  if ((jd || "").trim().length < 30) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-[var(--brand)]" />
        Paste a job description above to instantly see the keywords an ATS will
        scan for — categorised, counted, and free (no AI key needed).
      </div>
    );
  }

  if (keywords.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4" data-testid="jd-keywords">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
          Detected keywords ({keywords.length})
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Local · no AI · click a keyword to copy it
        </span>
      </div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.category}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: CATEGORY_DOT[g.category] ?? "#64748b" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {g.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.keywords.map((k) => (
                <button
                  key={k.token}
                  type="button"
                  onClick={async () => {
                    try {
                      await copyToClipboard(k.token);
                      toast(`✓ Copied “${k.token}”`);
                    } catch {
                      toast("✕ Copy failed");
                    }
                  }}
                  title={
                    (k.required > 1
                      ? `Mentioned ${k.count}× — clearly important; make sure it's on your CV. `
                      : `Mentioned ${k.count}×. `) + "Click to copy."
                  }
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
                    k.required > 1
                      ? "border-[var(--brand)]/40 bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-medium hover:bg-[color-mix(in_srgb,var(--brand)_20%,transparent)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-slate-700 dark:text-slate-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {k.token}
                  {k.count > 1 ? (
                    <span className="text-[10px] opacity-70 tabular-nums">×{k.count}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
