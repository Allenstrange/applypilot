"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Copy,
  Download,
  Save,
  Wand2,
  FileText,
  Mail,
  ListChecks,
  MessageSquare,
  PenLine,
  Bot,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAIConfigured } from "@/lib/ai";
import {
  generateCoverLetter,
  generateResumeSummary,
  generateInterviewPrep,
  generateOutreach,
  enhanceBulletVariants,
  enhanceTextVariants,
  optimizeResumeForJob,
} from "@/lib/generate";
import { exportCVPDF, exportCoverLetterPDF, exportResumeSummaryPDF } from "@/lib/pdf";
import { exportResumeDOCX } from "@/lib/docx";
import { exportResumeTXT } from "@/lib/resumeText";
import { checkBullet } from "@/lib/writingChecks";
import { copyToClipboard } from "@/lib/download";
import { toast } from "@/lib/toast";
import type {
  Profile,
  Analysis,
  CoverLetter,
  ResumeSummary,
  InterviewPrep,
  Outreach,
} from "@/lib/types";
import Highlight from "@/components/Highlight";
import KeywordBadges from "@/components/KeywordBadges";
import ResumeScorePanel from "@/components/ResumeScorePanel";
import ResumeAssistant from "@/components/ResumeAssistant";
import KeywordCoach from "@/components/KeywordCoach";
import ResumeInsights from "@/components/ResumeInsights";
import { Skeleton, PageSkeleton } from "@/components/Skeleton";

type Tab = "cv" | "assistant" | "coverLetter" | "resumeSummary" | "interviewPrep" | "outreach";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "cv", label: "CV", icon: FileText },
  { id: "assistant", label: "Assistant", icon: Bot },
  { id: "coverLetter", label: "Cover Letter", icon: Mail },
  { id: "resumeSummary", label: "Resume Summary", icon: PenLine },
  { id: "interviewPrep", label: "Interview Prep", icon: ListChecks },
  { id: "outreach", label: "Outreach", icon: MessageSquare },
];

export default function EditorPage() {
  const hydrated = useHydrated();
  const analysis = useStore((s) => s.currentAnalysis);
  const draftCV = useStore((s) => s.draftCV);
  const saveToTracker = useStore((s) => s.saveCurrentToTracker);
  const [tab, setTab] = useState<Tab>("cv");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!hydrated) {
    return <PageSkeleton />;
  }

  if (!analysis || !draftCV) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <PenLine className="w-10 h-10 mx-auto mb-3" />
        <div>No job selected for editing.</div>
        <Link href="/app/analyze" className="btn-primary px-4 py-2 rounded-lg text-sm mt-4 inline-block">
          Analyse a Job First
        </Link>
      </div>
    );
  }

  function onSave() {
    const r = saveToTracker();
    toast(r === "saved" ? "✓ Saved to tracker" : r === "exists" ? "ℹ Already in tracker" : "⚠ Nothing to save");
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Editing Room</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {analysis.title} at {analysis.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            data-testid="open-assistant-drawer"
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Bot className="w-4 h-4" /> Ask AI
          </button>
          <button type="button" onClick={onSave} className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> Save to Tracker
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative px-4 py-2 text-sm font-medium flex items-center gap-2 ${
              tab === id ? "text-amber-600" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
            {tab === id ? (
              <motion.div layoutId="tab-underline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-amber-400" />
            ) : null}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "cv" ? <CVTab analysis={analysis} draftCV={draftCV} /> : null}
          {tab === "assistant" ? <ResumeAssistant variant="tab" /> : null}
          {tab === "coverLetter" ? <CoverLetterTab analysis={analysis} draftCV={draftCV} /> : null}
          {tab === "resumeSummary" ? <ResumeSummaryTab analysis={analysis} draftCV={draftCV} /> : null}
          {tab === "interviewPrep" ? <InterviewPrepTab analysis={analysis} draftCV={draftCV} /> : null}
          {tab === "outreach" ? <OutreachTab analysis={analysis} draftCV={draftCV} /> : null}
        </motion.div>
      </AnimatePresence>

      <AssistantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// ---------------- ASSISTANT DRAWER ----------------

function AssistantDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            role="dialog"
            aria-label="Résumé assistant"
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl"
          >
            <ResumeAssistant variant="drawer" onClose={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

// ---------------- CV TAB ----------------

function CVTab({ analysis, draftCV }: { analysis: Analysis; draftCV: Profile }) {
  const updateDraftCV = useStore((s) => s.updateDraftCV);
  const setDraftCV = useStore((s) => s.setDraftCV);
  const providers = useStore((s) => s.providers);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [variants, setVariants] = useState<{ key: string; options: string[] } | null>(null);
  const [variantsLoading, setVariantsLoading] = useState<string | null>(null);
  const [secVariants, setSecVariants] = useState<{ kind: "summary" | "skills"; options: string[] } | null>(null);
  const [secLoading, setSecLoading] = useState<string | null>(null);

  async function loadSectionVariants(kind: "summary" | "skills") {
    if (!isAIConfigured(providers)) {
      toast("⚠ AI provider not configured");
      return;
    }
    setSecVariants(null);
    setSecLoading(kind);
    toast("⏳ Generating 3 options…");
    try {
      const text = kind === "summary" ? draftCV.summary : draftCV.skills;
      const options = await enhanceTextVariants(text, kind, providers);
      setSecVariants({ kind, options });
      toast("✓ Pick an option");
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setSecLoading(null);
    }
  }

  function applySec(kind: "summary" | "skills", text: string) {
    updateDraftCV(kind === "summary" ? { summary: text } : { skills: text });
    setSecVariants(null);
    toast("✓ Updated");
  }

  function renderSecAI(kind: "summary" | "skills") {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => loadSectionVariants(kind)}
          data-testid={`sec-ai-${kind}`}
          className="text-xs px-2 py-1 rounded bg-[var(--brand)] text-white dark:text-slate-900 inline-flex items-center gap-1"
        >
          {secLoading === kind ? "…" : "✨ AI rewrite (3 options)"}
        </button>
        {secVariants?.kind === kind ? (
          <div className="mt-2 space-y-1.5 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2" data-testid={`sec-variants-${kind}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Choose a rewrite</span>
              <button type="button" onClick={() => setSecVariants(null)} className="text-[10px] text-slate-400 hover:text-slate-600">Dismiss</button>
            </div>
            {secVariants.options.map((opt, k) => (
              <button
                key={k}
                type="button"
                onClick={() => applySec(kind, opt)}
                data-testid={`sec-variant-${kind}-${k}`}
                className="block w-full text-left text-xs px-2 py-1.5 rounded bg-white dark:bg-slate-800 hover:bg-violet-500/10 border border-slate-200 dark:border-slate-700"
              >
                <span className="text-violet-500 font-semibold mr-1">{k + 1}.</span>{opt}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  async function optimizeAll() {
    if (!isAIConfigured(providers)) {
      toast("⚠ AI provider not configured");
      return;
    }
    setOptimizing(true);
    toast("⏳ ATS-optimising your whole CV…");
    try {
      const optimized = await optimizeResumeForJob(draftCV, analysis, providers);
      setDraftCV(optimized);
      toast("✓ CV optimised for this job");
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setOptimizing(false);
    }
  }

  const updateExp = (i: number, patch: Partial<Profile["experience"][number]>) =>
    updateDraftCV({
      experience: draftCV.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });

  const updateBullet = (i: number, j: number, value: string) => {
    const lines = draftCV.experience[i].bullets.split("\n");
    lines[j] = value;
    updateExp(i, { bullets: lines.join("\n") });
  };

  async function loadVariants(i: number, j: number, mode: "star" | "professional" | "metrics") {
    setOpenMenu(null);
    if (!isAIConfigured(providers)) {
      toast("⚠ AI provider not configured");
      return;
    }
    const lines = draftCV.experience[i].bullets.split("\n");
    const key = `${i}-${j}`;
    setVariants(null);
    setVariantsLoading(key);
    toast("⏳ Generating 3 rewrite options…");
    try {
      const options = await enhanceBulletVariants(lines[j], mode, providers);
      setVariants({ key, options });
      toast("✓ Pick your favourite rewrite");
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setVariantsLoading(null);
    }
  }

  function applyVariant(i: number, j: number, text: string) {
    updateBullet(i, j, text);
    setVariants(null);
    toast("✓ Bullet updated");
  }

  // Live match rate
  const draftText = (
    draftCV.summary +
    " " +
    draftCV.skills +
    " " +
    draftCV.experience.map((e) => e.tools + " " + e.bullets).join(" ")
  ).toLowerCase();
  const matched = analysis.jdKeywords.filter((k) => draftText.includes(k.toLowerCase()));
  const missing = analysis.jdKeywords.filter((k) => !draftText.includes(k.toLowerCase()));
  const score = analysis.jdKeywords.length
    ? Math.round((matched.length / analysis.jdKeywords.length) * 100)
    : 0;
  const scoreColor = score > 70 ? "#4ade80" : score > 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <Section title="Professional Summary">
          <textarea rows={4} className="w-full px-3 py-2 rounded-lg text-sm" value={draftCV.summary} onChange={(e) => updateDraftCV({ summary: e.target.value })} />
          {renderSecAI("summary")}
        </Section>
        <Section title="Skills">
          <textarea rows={2} className="w-full px-3 py-2 rounded-lg text-sm" value={draftCV.skills} onChange={(e) => updateDraftCV({ skills: e.target.value })} />
          {renderSecAI("skills")}
        </Section>
        <Section title="Work Experience">
          <div className="space-y-4">
            {draftCV.experience.map((exp, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input className="px-2 py-1 rounded text-xs" placeholder="Role" value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
                  <input className="px-2 py-1 rounded text-xs" placeholder="Company" value={exp.company} onChange={(e) => updateExp(i, { company: e.target.value })} />
                </div>
                <div className="space-y-2">
                  {exp.bullets.split("\n").map((bullet, j) => (
                    <div key={j} className="relative pr-2">
                      <textarea
                        rows={2}
                        className="w-full px-2 py-1 rounded text-xs bg-slate-50 dark:bg-slate-800/50"
                        value={bullet}
                        onChange={(e) => updateBullet(i, j, e.target.value)}
                      />
                      <button
                        type="button"
                        data-testid={`bullet-ai-${i}-${j}`}
                        onClick={() => setOpenMenu(openMenu === `${i}-${j}` ? null : `${i}-${j}`)}
                        className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand)] text-white dark:text-slate-900"
                      >
                        {variantsLoading === `${i}-${j}` ? "…" : "✨ AI"}
                      </button>
                      {openMenu === `${i}-${j}` ? (
                        <div className="absolute top-7 right-1 z-10 glass rounded-lg p-1 text-xs min-w-44 shadow-xl">
                          <MenuItem onClick={() => loadVariants(i, j, "star")}>Rewrite in STAR format</MenuItem>
                          <MenuItem onClick={() => loadVariants(i, j, "professional")}>Make more professional</MenuItem>
                          <MenuItem onClick={() => loadVariants(i, j, "metrics")}>Add metric placeholders</MenuItem>
                        </div>
                      ) : null}
                      {variants && variants.key === `${i}-${j}` ? (
                        <div className="mt-2 space-y-1.5 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2" data-testid={`bullet-variants-${i}-${j}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Choose a rewrite</span>
                            <button type="button" onClick={() => setVariants(null)} className="text-[10px] text-slate-400 hover:text-slate-600">Dismiss</button>
                          </div>
                          {variants.options.map((opt, k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => applyVariant(i, j, opt)}
                              data-testid={`bullet-variant-${i}-${j}-${k}`}
                              className="block w-full text-left text-xs px-2 py-1.5 rounded bg-white dark:bg-slate-800 hover:bg-violet-500/10 border border-slate-200 dark:border-slate-700"
                            >
                              <span className="text-violet-500 font-semibold mr-1">{k + 1}.</span>{opt}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <BulletChecks text={bullet} />
                    </div>
                  ))}
                  <button type="button" onClick={() => updateExp(i, { bullets: exp.bullets + "\nNew bullet point here" })} className="text-xs text-amber-600 hover:text-amber-600 dark:text-amber-400">
                    + Add bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={optimizeAll} disabled={optimizing} data-testid="ats-optimize-btn" className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            {optimizing ? <span className="spinner" /> : <Wand2 className="w-4 h-4" />} One-click ATS optimise
          </button>
          <button type="button" onClick={() => { exportCVPDF(draftCV); toast("✓ CV downloaded"); }} data-testid="download-cv-btn" className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Download CV (PDF)
          </button>
          <button type="button" onClick={() => { exportResumeDOCX(draftCV, "classic"); toast("✓ Word downloaded"); }} data-testid="download-cv-word-btn" className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Word (.doc)
          </button>
          <button type="button" onClick={() => { exportResumeTXT(draftCV); toast("✓ Plain text downloaded"); }} data-testid="download-cv-txt-btn" className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Text (.txt)
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="glass rounded-xl p-4 mb-3 sticky top-4 z-10">
          <div className="text-xs text-slate-500 uppercase mb-1 dark:text-slate-400">Live Match Rate</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>{score}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {matched.length} of {analysis.jdKeywords.length} keywords matched
            </div>
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${score >= 75 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} data-testid="match-benchmark">
            {score >= 75 ? "✓ Above the 75% ATS benchmark" : "Aim for 75%+ to clear most ATS filters"}
          </div>
          {analysis.jdKeywords.length ? (
            <div className="mt-3 space-y-2" data-testid="inline-keyword-gaps">
              {missing.length ? (
                <>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
                    Missing keywords ({missing.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missing.map((k) => (
                      <span
                        key={k}
                        title="Not yet in your CV — weave it in if you have the experience"
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-dashed border-red-500/30"
                      >
                        + {k}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-green-600 dark:text-green-400">✓ All JD keywords present</div>
              )}
              {matched.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {matched.map((k) => (
                    <span
                      key={k}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/25"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <KeywordCoach />
        <ResumeInsights profile={draftCV} />
        <div className="mb-3" data-testid="editor-resume-score">
          <ResumeScorePanel profile={draftCV} />
        </div>
        <div className="rounded-xl overflow-hidden">
          <CVPreview profile={draftCV} keywords={analysis.jdKeywords} />
        </div>
      </div>
    </div>
  );
}

function CVPreview({ profile, keywords }: { profile: Profile; keywords: string[] }) {
  return (
    <div className="doc-preview">
      <h1>{profile.name || "Your Name"}</h1>
      <div>{[profile.title, profile.location].filter(Boolean).join(" | ")}</div>
      <div>{[profile.email, profile.phone, profile.linkedin].filter(Boolean).join(" | ")}</div>
      {profile.summary ? (<><h2>Professional Summary</h2><p><Highlight text={profile.summary} keywords={keywords} variant="mark" /></p></>) : null}
      {profile.skills ? (<><h2>Core Skills</h2><p><Highlight text={profile.skills} keywords={keywords} variant="mark" /></p></>) : null}
      {profile.experience.length ? <h2>Professional Experience</h2> : null}
      {profile.experience.map((exp, i) => (
        <div key={i}>
          <h3>{exp.role}{exp.company ? ` - ${exp.company}` : ""}</h3>
          <div><em>{[exp.start, exp.end].filter(Boolean).join(" - ")}</em></div>
          <ul>
            {exp.bullets.split("\n").filter((b) => b.trim()).map((b, j) => (
              <li key={j}><Highlight text={b.replace(/^[-•]\s*/, "")} keywords={keywords} variant="mark" /></li>
            ))}
          </ul>
          {exp.tools ? <div><strong>Tools:</strong> <Highlight text={exp.tools} keywords={keywords} variant="mark" /></div> : null}
        </div>
      ))}
      {profile.education.length ? <h2>Education</h2> : null}
      {profile.education.map((ed, i) => (
        <div key={i}>
          <h3>{ed.degree}</h3>
          <div>{[ed.institution, ed.year].filter(Boolean).join(", ")}</div>
        </div>
      ))}
      {profile.certs ? (
        <>
          <h2>Certifications</h2>
          <ul>{profile.certs.split("\n").filter(Boolean).map((c, i) => <li key={i}>{c.trim()}</li>)}</ul>
        </>
      ) : null}
    </div>
  );
}

// ---------------- GENERATION TABS ----------------

function useGenerate<T>(
  run: () => Promise<T>,
  onDone: (v: T) => void,
) {
  const providers = useStore((s) => s.providers);
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!isAIConfigured(providers)) {
      toast("⚠ AI provider not configured. Set one up in Settings.");
      return;
    }
    setBusy(true);
    toast("⏳ Generating…");
    try {
      onDone(await run());
      toast("✓ Generated");
    } catch (err) {
      toast("✕ Generation failed: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, go };
}

function CoverLetterTab({ analysis, draftCV }: { analysis: Analysis; draftCV: Profile }) {
  const providers = useStore((s) => s.providers);
  const data = useStore((s) => s.generations.coverLetter);
  const setGeneration = useStore((s) => s.setGeneration);
  const [tone, setTone] = useState("Professional");
  const { busy, go } = useGenerate<CoverLetter>(
    () => generateCoverLetter(draftCV, analysis, providers, tone),
    (v) => setGeneration("coverLetter", v),
  );

  function plainText(cl: CoverLetter) {
    return [cl.subjectLine, "", cl.salutation, "", ...cl.body, "", cl.closing, "", cl.signOff].join("\n");
  }

  return (
    <OutputShell
      title="Cover Letter"
      busy={busy}
      onGenerate={go}
      hasData={!!data}
      actions={
        <>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            data-testid="cover-tone-select"
            className="text-xs px-2 py-2 rounded-lg"
            aria-label="Cover letter tone"
          >
            {["Professional", "Formal", "Friendly", "Confident", "Concise", "Enthusiastic"].map((t) => (
              <option key={t} value={t}>{t} tone</option>
            ))}
          </select>
          {data ? (
            <>
              <CopyBtn text={() => plainText(data)} />
              <PdfBtn onClick={() => exportCoverLetterPDF(data, analysis.company)} />
            </>
          ) : null}
        </>
      }
    >
      {data ? (
        <div className="card rounded-xl p-6 space-y-4 leading-relaxed">
          <KeywordBadges keywords={data.keywords} />
          <div className="text-xs text-slate-500 uppercase dark:text-slate-400">Subject</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100"><Highlight text={data.subjectLine} keywords={data.keywords} /></div>
          <p className="text-slate-700 dark:text-slate-200"><Highlight text={data.salutation} keywords={data.keywords} /></p>
          {data.body.map((p, i) => (
            <p key={i} className="text-slate-600 dark:text-slate-300"><Highlight text={p} keywords={data.keywords} /></p>
          ))}
          <p className="text-slate-600 dark:text-slate-300"><Highlight text={data.closing} keywords={data.keywords} /></p>
          <p className="text-slate-700 whitespace-pre-line dark:text-slate-200"><Highlight text={data.signOff} keywords={data.keywords} /></p>
        </div>
      ) : null}
    </OutputShell>
  );
}

function ResumeSummaryTab({ analysis, draftCV }: { analysis: Analysis; draftCV: Profile }) {
  const providers = useStore((s) => s.providers);
  const data = useStore((s) => s.generations.resumeSummary);
  const setGeneration = useStore((s) => s.setGeneration);
  const { busy, go } = useGenerate<ResumeSummary>(
    () => generateResumeSummary(draftCV, analysis, providers),
    (v) => setGeneration("resumeSummary", v),
  );

  function plainText(rs: ResumeSummary) {
    return [rs.targetHeadline, "", rs.introSummary, "", ...rs.bulletPoints.map((b) => "• " + b)].join("\n");
  }

  return (
    <OutputShell
      title="Resume Summary Booster"
      busy={busy}
      onGenerate={go}
      hasData={!!data}
      actions={
        data ? (
          <>
            <CopyBtn text={() => plainText(data)} />
            <PdfBtn onClick={() => exportResumeSummaryPDF(data, draftCV)} />
          </>
        ) : null
      }
    >
      {data ? (
        <div className="card rounded-xl p-6 space-y-4">
          <KeywordBadges keywords={data.keywords} />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100"><Highlight text={data.targetHeadline} keywords={data.keywords} /></h3>
          <p className="text-slate-600 leading-relaxed dark:text-slate-300"><Highlight text={data.introSummary} keywords={data.keywords} /></p>
          <ul className="space-y-2">
            {data.bulletPoints.map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="text-slate-600 flex gap-2 dark:text-slate-300">
                <span className="text-amber-600 dark:text-amber-400">▸</span>
                <span><Highlight text={b} keywords={data.keywords} /></span>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : null}
    </OutputShell>
  );
}

function InterviewPrepTab({ analysis, draftCV }: { analysis: Analysis; draftCV: Profile }) {
  const providers = useStore((s) => s.providers);
  const data = useStore((s) => s.generations.interviewPrep);
  const setGeneration = useStore((s) => s.setGeneration);
  const { busy, go } = useGenerate<InterviewPrep>(
    () => generateInterviewPrep(draftCV, analysis, providers),
    (v) => setGeneration("interviewPrep", v),
  );

  function plainText(p: InterviewPrep) {
    return p.questions
      .map((q, i) => `Q${i + 1}: ${q}\nFrame: ${p.answerFormulas[i] ?? ""}\nCoach: ${p.coachTips[i] ?? ""}`)
      .join("\n\n");
  }

  return (
    <OutputShell
      title="Interview Prep Coach"
      busy={busy}
      onGenerate={go}
      hasData={!!data}
      actions={data ? <CopyBtn text={() => plainText(data)} /> : null}
    >
      {data ? (
        <div className="space-y-3">
          <KeywordBadges keywords={data.keywords} />
          {data.questions.map((q, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card rounded-xl p-5">
              <div className="font-semibold text-slate-900 mb-2 dark:text-slate-100">Q{i + 1}. <Highlight text={q} keywords={data.keywords} /></div>
              {data.answerFormulas[i] ? (
                <div className="text-sm text-slate-600 mb-2 dark:text-slate-300"><span className="text-amber-600 font-medium dark:text-amber-400">How to frame: </span><Highlight text={data.answerFormulas[i]} keywords={data.keywords} /></div>
              ) : null}
              {data.coachTips[i] ? (
                <div className="text-xs text-slate-500 dark:text-slate-400"><span className="text-violet-600 font-medium dark:text-violet-400">Coach tip: </span><Highlight text={data.coachTips[i]} keywords={data.keywords} /></div>
              ) : null}
            </motion.div>
          ))}
        </div>
      ) : null}
    </OutputShell>
  );
}

function OutreachTab({ analysis, draftCV }: { analysis: Analysis; draftCV: Profile }) {
  const providers = useStore((s) => s.providers);
  const data = useStore((s) => s.generations.outreach);
  const setGeneration = useStore((s) => s.setGeneration);
  const { busy, go } = useGenerate<Outreach>(
    () => generateOutreach(draftCV, analysis, providers),
    (v) => setGeneration("outreach", v),
  );

  return (
    <OutputShell
      title="Recruiter Outreach"
      busy={busy}
      onGenerate={go}
      hasData={!!data}
      actions={data ? <CopyBtn text={() => `${data.subject}\n\n${data.message}`} /> : null}
    >
      {data ? (
        <div className="card rounded-xl p-6 space-y-3">
          <KeywordBadges keywords={data.keywords} />
          <div className="text-xs text-slate-500 uppercase dark:text-slate-400">Subject</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100"><Highlight text={data.subject} keywords={data.keywords} /></div>
          <div className="text-slate-600 whitespace-pre-line leading-relaxed dark:text-slate-300"><Highlight text={data.message} keywords={data.keywords} /></div>
        </div>
      ) : null}
    </OutputShell>
  );
}

// ---------------- SHARED UI ----------------

function OutputShell({
  title,
  busy,
  hasData,
  onGenerate,
  actions,
  children,
}: {
  title: string;
  busy: boolean;
  hasData: boolean;
  onGenerate: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <div className="flex gap-2">
          {actions}
          <button type="button" onClick={onGenerate} disabled={busy} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            {busy ? <span className="spinner" /> : <Sparkles className="w-4 h-4" />}
            {hasData ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>
      {busy && !hasData ? (
        <div className="card rounded-xl p-6 space-y-3" data-testid="generation-skeleton">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : hasData ? (
        children
      ) : (
        <div className="card rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
          Click <span className="text-amber-600 dark:text-amber-400">Generate</span> to create tailored, keyword-rich content.
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text }: { text: () => string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await copyToClipboard(text());
          toast("✓ Copied to clipboard");
        } catch {
          toast("✕ Copy failed");
        }
      }}
      className="btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-2"
    >
      <Copy className="w-4 h-4" /> Copy
    </button>
  );
}

function PdfBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => { onClick(); toast("✓ PDF downloaded"); }}
      className="btn-ghost px-3 py-2 rounded-lg text-sm flex items-center gap-2"
    >
      <Download className="w-4 h-4" /> PDF
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-600 mb-2 dark:text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

function BulletChecks({ text }: { text: string }) {
  const issues = checkBullet(text);
  if (!issues.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1" data-testid="bullet-checks">
      {issues.map((iss) => (
        <span
          key={iss.id}
          title={iss.detail}
          className={`text-[10px] px-1.5 py-0.5 rounded-full border cursor-help ${
            iss.severity === "warn"
              ? "border-red-400/40 bg-red-500/10 text-red-600 dark:text-red-400"
              : "border-[var(--border)] bg-[var(--surface-2)] text-slate-500 dark:text-slate-400"
          }`}
        >
          {iss.label}
        </span>
      ))}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left px-3 py-2 rounded hover:bg-amber-500/20 text-slate-700 dark:text-slate-200">
      {children}
    </button>
  );
}
