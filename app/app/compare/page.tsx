"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Minus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { scoreResume } from "@/lib/resumeScore";
import { diffSkills, diffWords } from "@/lib/compare";
import type { Profile } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import CvWorkspaceTabs from "@/components/CvWorkspaceTabs";

const PROFILE_ID = "__profile__";

interface Source {
  id: string;
  name: string;
  profile: Profile;
}

export default function ComparePage() {
  const hydrated = useHydrated();
  const resumes = useStore((s) => s.resumes);
  const profile = useStore((s) => s.profile);

  const sources: Source[] = useMemo(() => {
    const list: Source[] = [{ id: PROFILE_ID, name: "Master Profile", profile }];
    resumes.forEach((r) => list.push({ id: r.id, name: r.name, profile: r.profile }));
    return list;
  }, [resumes, profile]);

  const [aId, setAId] = useState<string>(PROFILE_ID);
  const [bId, setBId] = useState<string>("");

  // default B to the first resume once hydrated
  const effectiveBId = bId || (resumes[0]?.id ?? PROFILE_ID);

  const a = sources.find((s) => s.id === aId) ?? sources[0];
  const b = sources.find((s) => s.id === effectiveBId) ?? sources[sources.length - 1];

  if (!hydrated) {
    return (
      <div className="p-8">
        <PageHeader title="⚖ Compare Resumes" subtitle="Loading…" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="p-8">
        <CvWorkspaceTabs />
        <PageHeader title="⚖ Compare Resumes" subtitle="See two versions side by side with scores and a diff." />
        <div className="card rounded-xl p-12 text-center text-slate-500 dark:text-slate-400" data-testid="compare-empty">
          You need at least one saved resume to compare. Create one from your{" "}
          <Link href="/app/resumes" className="text-violet-600 underline dark:text-violet-400">Resumes</Link> library.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="compare-page">
      <CvWorkspaceTabs />
      <PageHeader
        title="⚖ Compare Resumes"
        subtitle="Pick two versions to see scores side by side, plus a skill and summary diff."
      />

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Picker label="Version A" value={aId} onChange={setAId} sources={sources} testid="select-a" />
        <Picker label="Version B" value={effectiveBId} onChange={setBId} sources={sources} testid="select-b" />
      </div>

      <Comparison a={a} b={b} />
    </div>
  );
}

function Picker({
  label, value, onChange, sources, testid,
}: {
  label: string; value: string; onChange: (v: string) => void; sources: Source[]; testid: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full px-3 py-2 rounded-lg text-sm"
      >
        {sources.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

function Comparison({ a, b }: { a: Source; b: Source }) {
  const sa = scoreResume(a.profile);
  const sb = scoreResume(b.profile);
  const skills = diffSkills(a.profile.skills, b.profile.skills);
  const summaryDiff = diffWords(a.profile.summary || "", b.profile.summary || "");

  const overallWinner = sa.overall === sb.overall ? "tie" : sa.overall > sb.overall ? "a" : "b";

  return (
    <div data-testid="compare-results">
      {/* Score header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ScoreColumn source={a} score={sa.overall} winner={overallWinner === "a"} side="A" testid="score-a" />
        <ScoreColumn source={b} score={sb.overall} winner={overallWinner === "b"} side="B" testid="score-b" />
      </div>

      {/* Category comparison */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Category breakdown</h2>
        <div className="space-y-3">
          {sa.categories.map((cat, i) => {
            const other = sb.categories[i];
            const aWins = cat.score > other.score;
            const bWins = other.score > cat.score;
            return (
              <div key={cat.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm" data-testid={`cat-${i}`}>
                <div className="flex items-center justify-end gap-2">
                  {aWins ? <Trophy className="w-3.5 h-3.5 text-amber-500" /> : null}
                  <span className={`font-semibold ${aWins ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>{cat.score}</span>
                  <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500 ml-auto" style={{ width: `${(cat.score / cat.max) * 100}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center w-28 truncate">{cat.label}</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${(other.score / other.max) * 100}%` }} />
                  </div>
                  <span className={`font-semibold ${bWins ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>{other.score}</span>
                  {bWins ? <Trophy className="w-3.5 h-3.5 text-amber-500" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills diff */}
      <div className="card rounded-xl p-6 mb-6" data-testid="skills-diff">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Skills difference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkillBucket title={`Only in A (${skills.onlyA.length})`} skills={skills.onlyA} cls="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" />
          <SkillBucket title={`In both (${skills.both.length})`} skills={skills.both} cls="bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20" />
          <SkillBucket title={`Only in B (${skills.onlyB.length})`} skills={skills.onlyB} cls="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" />
        </div>
      </div>

      {/* Summary diff */}
      <div className="card rounded-xl p-6" data-testid="summary-diff">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Summary diff</h2>
        <p className="text-xs mb-4 flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Removed in B</span>
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">Added in B</span>
          <span className="text-slate-500 dark:text-slate-400">unchanged</span>
        </p>
        {a.profile.summary || b.profile.summary ? (
          <p className="text-sm leading-relaxed">
            {summaryDiff.map((t, i) => (
              <span
                key={i}
                className={
                  t.type === "del"
                    ? "bg-red-500/15 text-red-600 line-through dark:text-red-400"
                    : t.type === "add"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : "text-slate-600 dark:text-slate-300"
                }
              >
                {t.text}
              </span>
            ))}
          </p>
        ) : (
          <div className="text-sm text-slate-400 flex items-center gap-2"><Minus className="w-4 h-4" /> Neither version has a summary.</div>
        )}
      </div>
    </div>
  );
}

function ScoreColumn({ source, score, winner, side, testid }: { source: Source; score: number; winner: boolean; side: string; testid: string }) {
  const color = score >= 80 ? "#16a34a" : score >= 55 ? "#d97706" : "#dc2626";
  const C = 2 * Math.PI * 30;
  return (
    <div className={`card rounded-xl p-6 ${winner ? "ring-2 ring-amber-400" : ""}`} data-testid={testid}>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="8" />
            <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)}
              transform="rotate(-90 40 40)" strokeLinecap="round" className="progress-ring" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold" style={{ color }}>{score}</div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{side}</span>
            {winner ? <span className="status-pill bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Higher</span> : null}
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{source.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {source.profile.experience.length} {source.profile.experience.length === 1 ? "role" : "roles"} · {source.profile.skills.split(",").filter((x) => x.trim()).length} {source.profile.skills.split(",").filter((x) => x.trim()).length === 1 ? "skill" : "skills"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillBucket({ title, skills, cls }: { title: string; skills: string[]; cls: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {skills.length ? skills.map((s, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{s}</span>
        )) : <span className="text-xs text-slate-400">—</span>}
      </div>
    </div>
  );
}
