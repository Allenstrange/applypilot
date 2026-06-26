"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Send, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAIConfigured, AI_PROVIDERS } from "@/lib/ai";
import { nextQuestion, scoreAnswer, type InterviewContext } from "@/lib/interview";
import { toast } from "@/lib/toast";
import type { InterviewTurn } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

export default function InterviewPage() {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const providers = useStore((s) => s.providers);
  const analysis = useStore((s) => s.currentAnalysis);

  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);

  const ctx: InterviewContext = useMemo(
    () => ({
      role: analysis?.title || profile.title || "",
      company: analysis?.company || "",
      jd: analysis?.jd,
    }),
    [analysis, profile.title],
  );

  const aiReady = hydrated && isAIConfigured(providers);
  const answered = turns.filter((t) => t.feedback);
  const avgScore = answered.length
    ? Math.round(answered.reduce((s, t) => s + (t.feedback?.score ?? 0), 0) / answered.length)
    : 0;
  const current = turns[turns.length - 1];
  const awaitingAnswer = current && !current.feedback;

  async function start() {
    if (!aiReady) {
      toast("⚠ Configure an AI provider in Settings");
      return;
    }
    setBusy(true);
    setStarted(true);
    toast("⏳ Starting interview…");
    try {
      const q = await nextQuestion(ctx, [], providers);
      setTurns([{ question: q }]);
      toast("✓ First question ready");
    } catch (err) {
      toast("✕ " + (err as Error).message);
      setStarted(false);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!awaitingAnswer || !input.trim()) return;
    const answer = input.trim();
    setBusy(true);
    setInput("");
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, answer } : x)));
    toast("⏳ Scoring your answer…");
    try {
      const fb = await scoreAnswer(ctx, current!.question, answer, providers);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, feedback: fb } : x)));
      toast(`✓ Scored ${fb.score}/100`);
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function askNext() {
    setBusy(true);
    toast("⏳ Next question…");
    try {
      const asked = turns.map((t) => t.question);
      const q = await nextQuestion(ctx, asked, providers);
      setTurns((t) => [...t, { question: q }]);
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTurns([]);
    setInput("");
    setStarted(false);
  }

  return (
    <div className="p-8" data-testid="interview-page">
      <PageHeader
        title="🎤 Mock Interview"
        subtitle="Practise with an AI interviewer that asks tailored questions and scores every answer."
      />

      {/* Context banner */}
      <div className="card rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm">
          <span className="text-slate-500 dark:text-slate-400">Interviewing for: </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {ctx.role || "General role"}
          </span>
          {ctx.company ? <span className="text-slate-500 dark:text-slate-400"> · {ctx.company}</span> : null}
          {!analysis ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
              (<Link href="/app/analyze" className="underline">analyse a job</Link> for role-specific questions)
            </span>
          ) : null}
        </div>
        {answered.length > 0 ? (
          <div className="flex items-center gap-2 text-sm" data-testid="interview-avg">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-slate-500 dark:text-slate-400">Avg score:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{avgScore}/100</span>
            <span className="text-xs text-slate-400">· {answered.length} answered</span>
          </div>
        ) : null}
      </div>

      {!aiReady ? (
        <div className="card rounded-xl p-4 mb-6 text-sm bg-violet-500/10 border border-violet-500/20">
          <span className="text-violet-600 dark:text-violet-400">ℹ AI provider not configured. </span>
          <Link href="/app/settings" className="underline">Set one up</Link> to start the interview.
        </div>
      ) : null}

      {!started ? (
        <div className="card rounded-xl p-10 text-center" data-testid="interview-intro">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Ready to practise?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            The AI will ask realistic questions one at a time. Answer in your own words and get an instant score,
            strengths, fixes and a model answer.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={busy || !aiReady}
            data-testid="interview-start-btn"
            className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            {busy ? <span className="spinner" /> : <Mic className="w-4 h-4" />}
            Start interview
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {turns.map((turn, i) => (
            <TurnCard key={i} turn={turn} index={i} />
          ))}

          {awaitingAnswer ? (
            <div className="card rounded-xl p-4" data-testid="answer-box">
              <textarea
                rows={5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                data-testid="answer-input"
                className="w-full px-3 py-2 rounded-lg text-sm"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !input.trim()}
                  data-testid="answer-submit-btn"
                  className="btn-primary px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {busy ? <span className="spinner" /> : <Send className="w-4 h-4" />}
                  Submit answer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={askNext}
                disabled={busy}
                data-testid="next-question-btn"
                className="btn-primary px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {busy ? <span className="spinner" /> : <ChevronRight className="w-4 h-4" />}
                Next question
              </button>
              <button
                type="button"
                onClick={reset}
                data-testid="interview-reset-btn"
                className="btn-ghost px-5 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> End &amp; reset
              </button>
            </div>
          )}
        </div>
      )}

      {hydrated && aiReady ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
          Powered by {AI_PROVIDERS[providers.activeProvider].name}.
        </p>
      ) : null}
    </div>
  );
}

function TurnCard({ turn, index }: { turn: InterviewTurn; index: number }) {
  const fb = turn.feedback;
  const scoreColor = fb ? (fb.score >= 75 ? "#22c55e" : fb.score >= 50 ? "#f59e0b" : "#ef4444") : "#94a3b8";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3" data-testid={`turn-${index}`}>
      <div className="card rounded-xl p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-1">
          Question {index + 1}
        </div>
        <div className="text-slate-900 dark:text-slate-100 font-medium">{turn.question}</div>
      </div>

      {turn.answer ? (
        <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-800/60 ml-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Your answer
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{turn.answer}</div>
        </div>
      ) : null}

      <AnimatePresence>
        {fb ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="card rounded-xl p-5"
            data-testid={`feedback-${index}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl font-bold" style={{ color: scoreColor }} data-testid={`feedback-score-${index}`}>
                {fb.score}<span className="text-sm text-slate-400">/100</span>
              </div>
              <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${fb.score}%`, background: scoreColor }} />
              </div>
            </div>

            {fb.strengths.length ? (
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Strengths</div>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {fb.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-green-500">+</span><span>{s}</span></li>)}
                </ul>
              </div>
            ) : null}

            {fb.improvements.length ? (
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">To improve</div>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {fb.improvements.map((s, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">→</span><span>{s}</span></li>)}
                </ul>
              </div>
            ) : null}

            {fb.modelAnswer ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-violet-600 dark:text-violet-400 font-medium">Show model answer</summary>
                <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-line">{fb.modelAnswer}</p>
              </details>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
