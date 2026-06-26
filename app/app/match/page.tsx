"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Target, Plus, Trash2, Sparkles, ClipboardList, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAIConfigured, AI_PROVIDERS } from "@/lib/ai";
import { matchJob } from "@/lib/match";
import { optimizeResumeForJob } from "@/lib/generate";
import { exportCVPDF } from "@/lib/pdf";
import { toast } from "@/lib/toast";
import type { JobMatch, Application, Analysis } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

// Module-scope id generator keeps the impure Date.now()/Math.random() calls
// out of the component render path (react-compiler purity rule).
const newAppId = () => Date.now() + Math.floor(Math.random() * 1000);

interface JobInput {
  id: string;
  text: string;
}

const VERDICT_STYLE: Record<JobMatch["verdict"], { label: string; cls: string; ring: string }> = {
  strong: { label: "Strong match", cls: "bg-green-500/15 text-green-600 dark:text-green-400", ring: "#22c55e" },
  good: { label: "Good match", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400", ring: "#f59e0b" },
  stretch: { label: "Stretch", cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400", ring: "#fb923c" },
  weak: { label: "Weak fit", cls: "bg-red-500/15 text-red-600 dark:text-red-400", ring: "#ef4444" },
};

export default function MatchPage() {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const providers = useStore((s) => s.providers);
  const addApplication = useStore((s) => s.addApplication);
  const addResume = useStore((s) => s.addResume);
  const applications = useStore((s) => s.applications);
  const setApplicationResume = useStore((s) => s.setApplicationResume);

  const [jobs, setJobs] = useState<JobInput[]>([{ id: crypto.randomUUID(), text: "" }]);
  const [results, setResults] = useState<JobMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [tailoring, setTailoring] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const aiReady = hydrated && isAIConfigured(providers);
  const profileReady = hydrated && !!(profile.name && profile.skills);

  function addJob() {
    setJobs((j) => [...j, { id: crypto.randomUUID(), text: "" }]);
  }
  function removeJob(id: string) {
    setJobs((j) => (j.length > 1 ? j.filter((x) => x.id !== id) : j));
  }
  function setJobText(id: string, text: string) {
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, text } : x)));
  }

  async function runMatch() {
    if (!profileReady) {
      toast("⚠ Complete your master profile first");
      return;
    }
    if (!aiReady) {
      toast("⚠ Configure an AI provider in Settings");
      return;
    }
    const filled = jobs.filter((j) => j.text.trim().length > 30);
    if (filled.length === 0) {
      toast("⚠ Paste at least one job posting");
      return;
    }
    setBusy(true);
    setResults([]);
    toast(`⏳ Scoring ${filled.length} job${filled.length > 1 ? "s" : ""}…`);
    try {
      const settled = await Promise.all(
        filled.map(async (j) => {
          try {
            const m = await matchJob(profile, j.text, providers);
            return { ...m, id: j.id } as JobMatch;
          } catch {
            return null;
          }
        }),
      );
      const ok = settled.filter((x): x is JobMatch => x !== null).sort((a, b) => b.fit - a.fit);
      setResults(ok);
      if (ok.length === 0) toast("✕ Matching failed — check your API key");
      else toast(`✓ Ranked ${ok.length} job${ok.length > 1 ? "s" : ""}`);
    } finally {
      setBusy(false);
    }
  }

  function track(m: JobMatch) {
    const app: Application = {
      id: newAppId(),
      company: m.company,
      title: m.title,
      status: "planned",
      createdAt: new Date().toISOString(),
      notes: `Matched at ${m.fit}% fit (${m.verdict}).`,
    };
    addApplication(app);
    toast("✓ Added to tracker");
  }

  function matchToAnalysis(m: JobMatch): Analysis {
    return {
      company: m.company, title: m.title, location: "", url: "", jd: m.jd,
      jdKeywords: [], matched: [], missing: [], gaps: [], overallFit: m.fit,
      senioritySignal: "", domainTags: [], atsWarnings: [], isSemantic: false,
    };
  }

  async function tailorOne(m: JobMatch) {
    if (!profileReady) { toast("⚠ Complete your master profile first"); return; }
    if (!aiReady) { toast("⚠ Configure an AI provider in Settings"); return; }
    setTailoring(m.id);
    toast("⏳ Tailoring your CV for this role…");
    try {
      const name = `${m.title} – ${m.company}`;
      const tailored = await optimizeResumeForJob(profile, matchToAnalysis(m), providers);
      const resumeId = addResume(name, "classic", tailored);
      exportCVPDF(tailored);
      const existing = applications.find((a) => a.company === m.company && a.title === m.title);
      if (existing) {
        setApplicationResume(existing.id, resumeId);
      } else {
        addApplication({
          id: newAppId(),
          company: m.company,
          title: m.title,
          status: "planned",
          createdAt: new Date().toISOString(),
          notes: `Tailored CV (${m.fit}% fit).`,
          resumeId,
          resumeName: name,
        });
      }
      toast("✓ Tailored CV saved, linked & tracked");
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setTailoring(null);
    }
  }

  async function tailorAll() {
    if (!profileReady) { toast("⚠ Complete your master profile first"); return; }
    if (!aiReady) { toast("⚠ Configure an AI provider in Settings"); return; }
    if (results.length === 0) return;
    setBulkBusy(true);
    toast(`⏳ Tailoring ${results.length} CV${results.length > 1 ? "s" : ""}…`);
    let ok = 0;
    for (const m of results) {
      try {
        const tailored = await optimizeResumeForJob(profile, matchToAnalysis(m), providers);
        addResume(`${m.title} – ${m.company}`, "classic", tailored);
        ok += 1;
      } catch { /* skip individual failures */ }
    }
    setBulkBusy(false);
    toast(ok ? `✓ Saved ${ok} tailored CV${ok > 1 ? "s" : ""} to your library` : "✕ Tailoring failed — check your API key");
  }

  return (
    <div className="p-8" data-testid="match-page">
      <PageHeader
        title="🎯 Job Matcher"
        subtitle="Paste one or many job postings and instantly rank them by how well they fit your profile."
      />

      {!profileReady ? (
        <div className="card rounded-xl p-4 mb-6 text-sm bg-amber-500/10 border border-amber-500/20">
          <span className="text-amber-600 dark:text-amber-400">⚠ Your master profile is incomplete. </span>
          <Link href="/app/profile" className="underline">Complete it</Link> for accurate matching.
        </div>
      ) : null}
      {profileReady && !aiReady ? (
        <div className="card rounded-xl p-4 mb-6 text-sm bg-violet-500/10 border border-violet-500/20">
          <span className="text-violet-600 dark:text-violet-400">ℹ AI provider not configured. </span>
          <Link href="/app/settings" className="underline">Set one up</Link> — matching needs AI.
        </div>
      ) : null}

      <div className="space-y-4 mb-4">
        {jobs.map((j, i) => (
          <div key={j.id} className="card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Job {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeJob(j.id)}
                disabled={jobs.length === 1}
                data-testid={`remove-job-${i}`}
                className="text-red-600 text-xs hover:text-red-700 flex items-center gap-1 disabled:opacity-30 dark:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
            <textarea
              rows={6}
              value={j.text}
              onChange={(e) => setJobText(j.id, e.target.value)}
              data-testid={`job-input-${i}`}
              placeholder="Paste the job title, company and full description here…"
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          type="button"
          onClick={addJob}
          data-testid="add-job-btn"
          className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add another job
        </button>
        <button
          type="button"
          onClick={runMatch}
          disabled={busy}
          data-testid="match-run-btn"
          className="btn-primary px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          {busy ? <span className="spinner" /> : <Target className="w-4 h-4" />}
          Match &amp; rank
        </button>
        {aiReady ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            via {AI_PROVIDERS[providers.activeProvider].name}
          </span>
        ) : null}
      </div>

      {results.length > 0 ? (
        <div className="space-y-4" data-testid="match-results">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Ranked results ({results.length})
            </h2>
            <button
              type="button"
              onClick={tailorAll}
              disabled={bulkBusy}
              data-testid="bulk-tailor-btn"
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {bulkBusy ? <span className="spinner" /> : <Wand2 className="w-4 h-4" />}
              Tailor CVs for all
            </button>
          </div>
          {results.map((m, i) => (
            <ResultCard
              key={m.id}
              match={m}
              rank={i + 1}
              onTrack={() => track(m)}
              onTailor={() => tailorOne(m)}
              tailoring={tailoring === m.id}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({ match: m, rank, onTrack, onTailor, tailoring }: { match: JobMatch; rank: number; onTrack: () => void; onTailor: () => void; tailoring: boolean }) {
  const v = VERDICT_STYLE[m.verdict];
  const C = 2 * Math.PI * 26;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="card rounded-xl p-5"
      data-testid={`match-card-${rank}`}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div className="relative w-16 h-16 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="7" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={v.ring} strokeWidth="7"
              strokeDasharray={C} strokeDashoffset={C * (1 - m.fit / 100)}
              transform="rotate(-90 32 32)" strokeLinecap="round" className="progress-ring" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-base font-bold" style={{ color: v.ring }}>
            {m.fit}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{rank}</span>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</h3>
            <span className={`status-pill ${v.cls}`}>{v.label}</span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{m.company}</div>
        </div>

        <div className="flex flex-col gap-2 self-start">
          <button
            type="button"
            onClick={onTrack}
            data-testid={`track-match-${rank}`}
            className="btn-ghost px-3 py-2 rounded-lg text-xs flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Track
          </button>
          <button
            type="button"
            onClick={onTailor}
            disabled={tailoring}
            data-testid={`tailor-match-${rank}`}
            className="btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {tailoring ? <span className="spinner" /> : <Wand2 className="w-3.5 h-3.5" />} Tailor CV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Reasons to apply
          </div>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {m.reasons.length ? m.reasons.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-green-500">+</span><span>{r}</span></li>
            )) : <li className="text-slate-400">—</li>}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400 mb-1.5">
            Gaps to address
          </div>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {m.gaps.length ? m.gaps.map((g, i) => (
              <li key={i} className="flex gap-2"><span className="text-red-400">−</span><span>{g}</span></li>
            )) : <li className="text-slate-400">—</li>}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
