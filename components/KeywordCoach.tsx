"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Target, Check, RefreshCw, SkipForward, Sparkles, Settings2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { isAIConfigured } from "@/lib/ai";
import { generateKeywordBullet } from "@/lib/generate";
import { scoreResume } from "@/lib/resumeScore";
import { toast } from "@/lib/toast";
import Highlight from "@/components/Highlight";

/**
 * Guided "Keyword Targeting" queue (Rezi-style): walks the user through each JD
 * keyword the CV is still missing — pick which role it belongs to, let the AI
 * draft ONE bullet that weaves it in, then Accept / Rewrite / Skip. The keyword
 * list and queue are free/local; only drafting a bullet spends an AI call.
 */
export default function KeywordCoach() {
  const draftCV = useStore((s) => s.draftCV);
  const analysis = useStore((s) => s.currentAnalysis);
  const providers = useStore((s) => s.providers);
  const updateDraftCV = useStore((s) => s.updateDraftCV);
  const reduce = useReducedMotion();

  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [roleIdx, setRoleIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "busy" | "review">("idle");
  const [draftBullet, setDraftBullet] = useState("");

  const missing = useMemo(() => {
    if (!draftCV || !analysis) return [] as string[];
    const text = (
      draftCV.summary +
      " " +
      draftCV.skills +
      " " +
      draftCV.experience.map((e) => e.tools + " " + e.bullets).join(" ")
    ).toLowerCase();
    return analysis.jdKeywords.filter((k) => !text.includes(k.toLowerCase()));
  }, [draftCV, analysis]);

  if (!draftCV || !analysis || analysis.jdKeywords.length === 0) return null;
  if (draftCV.experience.length === 0) return null;

  const configured = isAIConfigured(providers);
  const queue = missing.filter((k) => !skipped.has(k) && !resolved.has(k));
  const current = queue[0];
  const total = analysis.jdKeywords.length;
  const covered = total - missing.length;

  async function generate(kw: string) {
    if (!configured) {
      toast("⚠ Connect an AI provider to draft bullets");
      return;
    }
    setPhase("busy");
    setDraftBullet("");
    try {
      const b = await generateKeywordBullet(draftCV!, roleIdx, kw, analysis!, providers);
      if (!b) throw new Error("Empty response — try Rewrite");
      setDraftBullet(b);
      setPhase("review");
    } catch (e) {
      toast("✕ " + (e as Error).message);
      setPhase("idle");
    }
  }

  function accept(kw: string) {
    const cur = useStore.getState().draftCV;
    if (!cur) return;
    const before = scoreResume(cur).overall;
    const experience = cur.experience.map((e, i) =>
      i === roleIdx
        ? { ...e, bullets: e.bullets.trim() ? `${e.bullets}\n${draftBullet}` : draftBullet }
        : e,
    );
    updateDraftCV({ experience });
    const after = scoreResume({ ...cur, experience }).overall;
    setResolved((r) => new Set(r).add(kw));
    setPhase("idle");
    setDraftBullet("");
    toast(after !== before ? `✓ Added · score ${before}→${after}` : "✓ Bullet added");
  }

  function skip(kw: string) {
    setSkipped((s) => new Set(s).add(kw));
    setPhase("idle");
    setDraftBullet("");
  }

  return (
    <div className="card rounded-xl p-4 mb-3" data-testid="keyword-coach">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Target className="w-4 h-4 text-[var(--brand)]" /> Keyword Targeting
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          {covered}/{total} covered
        </span>
      </div>

      {!current ? (
        <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
          {missing.length === 0 ? (
            <span className="text-green-600 dark:text-green-400">✓ Every JD keyword is on your CV.</span>
          ) : (
            <>You&apos;ve worked through the queue. {skipped.size} skipped keyword{skipped.size === 1 ? "" : "s"} left out.</>
          )}
        </div>
      ) : (
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Missing keyword — add a bullet that proves it, or skip if it doesn&apos;t fit.
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/40 bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
              {current}
            </span>
            <span className="text-[11px] text-slate-400">{queue.length} left</span>
          </div>

          {!configured ? (
            <Link href="/app/settings" className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline mb-2">
              <Settings2 className="w-3.5 h-3.5" /> Connect an AI provider to draft bullets <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null}

          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Add to which role?
          </label>
          <select
            value={roleIdx}
            onChange={(e) => setRoleIdx(Number(e.target.value))}
            data-testid="coach-role"
            aria-label="Choose a role for the new bullet"
            className="w-full px-2.5 py-1.5 rounded-lg text-xs mb-2"
          >
            {draftCV.experience.map((e, i) => (
              <option key={i} value={i}>
                {e.role || "Untitled role"}{e.company ? ` — ${e.company}` : ""}
              </option>
            ))}
          </select>

          {phase === "review" ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="review"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 mb-2"
                data-testid="coach-bullet"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
                  Proposed bullet
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-100">
                  <Highlight text={draftBullet} keywords={[current]} variant="mark" />
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => accept(current)}
                    data-testid="coach-accept"
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--brand)] text-white dark:text-slate-900 font-medium inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Accept &amp; next
                  </button>
                  <button
                    type="button"
                    onClick={() => generate(current)}
                    data-testid="coach-rewrite"
                    className="text-[11px] px-2 py-1 rounded-md border border-[var(--border)] text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Rewrite
                  </button>
                  <button
                    type="button"
                    onClick={() => skip(current)}
                    data-testid="coach-skip"
                    className="text-[11px] px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 ml-auto"
                  >
                    <SkipForward className="w-3 h-3" /> Skip
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generate(current)}
                disabled={phase === "busy"}
                data-testid="coach-generate"
                className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {phase === "busy" ? <span className="spinner" /> : <Sparkles className="w-3.5 h-3.5" />}
                Draft a bullet
              </button>
              <button
                type="button"
                onClick={() => skip(current)}
                data-testid="coach-skip-idle"
                className="text-xs px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
