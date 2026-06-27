"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { scoreResume } from "@/lib/resumeScore";

const SEV = {
  error: { Icon: AlertCircle, cls: "text-red-600 dark:text-red-400" },
  warning: { Icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400" },
  tip: { Icon: Lightbulb, cls: "text-violet-600 dark:text-violet-400" },
} as const;

const RADIUS = 26;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Always-on, per-keystroke readiness coach. Runs the local heuristic engine
 * (scoreResume — no AI, no network) and presents it as an active, animated
 * panel: the score counts up, the ring fills, and the prioritised issues read
 * as next steps. This is the "the product has an opinion at all times" surface.
 */
export default function LiveCoach({ profile }: { profile: Profile }) {
  const { overall, categories, issues } = scoreResume(profile);
  const color = overall >= 80 ? "#16a34a" : overall >= 55 ? "#d97706" : "#dc2626";
  const strong = categories.filter((c) => c.score === c.max).length;

  // Animate the number with a motion value so there is no React state churn
  // on every frame (keeps the React Compiler lint rules happy).
  const reduced = useReducedMotion();
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    if (reduced) {
      count.set(overall);
      return;
    }
    const controls = animate(count, overall, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [overall, count, reduced]);

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          Profile readiness
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2">
            {reduced ? null : (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
          </span>
          Live
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="7"
            />
            <motion.circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeDasharray={CIRC}
              initial={false}
              animate={{ strokeDashoffset: CIRC * (1 - overall / 100) }}
              transition={{ duration: reduced ? 0 : 0.6, ease: "easeOut" }}
              transform="rotate(-90 32 32)"
              strokeLinecap="round"
            />
          </svg>
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color }}
          >
            {display}
          </motion.div>
        </div>
        <div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {overall >= 80
              ? "Strong — minor tweaks only"
              : overall >= 55
                ? "Getting there — a few fixes"
                : "Let's build this up"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {strong} of {categories.length} sections strong
          </div>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Looks great — nothing to
          fix.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Next steps (
            {issues.length})
          </div>
          <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar pr-1">
            {issues.map((issue, i) => {
              const { Icon, cls } = SEV[issue.severity];
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cls}`} />
                  <span className="text-slate-700 dark:text-slate-200">
                    {issue.message}
                    {issue.where ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        {" "}
                        · {issue.where}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
