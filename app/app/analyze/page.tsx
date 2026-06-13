"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Search, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAIConfigured, AI_PROVIDERS } from "@/lib/ai";
import { analyseJob } from "@/lib/analysis";
import { toast } from "@/lib/toast";
import type { Analysis } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

const SAMPLE_JD = `About the role:
We are looking for a 1st/2nd Line Support Analyst to join our IT services team in Birmingham. You will provide technical support to internal users across multiple offices, handling incidents, service requests, and problems in line with SLA targets.

Key responsibilities:
- Provide 1st and 2nd line support via ServiceNow ticketing
- Troubleshoot Windows 10/11, Office 365, Active Directory and Azure AD
- Support endpoint management via Intune and SCCM
- Assist with network issues (TCP/IP, DNS, DHCP, VPN)
- Escalate complex issues to 3rd line with clear diagnostics
- Participate in ITIL-aligned change and problem management

Requirements:
- 2+ years in IT support or service desk role
- Strong experience with Active Directory, Office 365, Azure AD
- Confident with ServiceNow or similar ITSM tool
- Understanding of networking fundamentals (TCP/IP, DNS, DHCP)
- ITIL Foundation desirable
- PowerShell scripting experience desirable`;

export default function AnalyzePage() {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const providers = useStore((s) => s.providers);
  const currentAnalysis = useStore((s) => s.currentAnalysis);
  const setAnalysis = useStore((s) => s.setAnalysis);

  const [form, setForm] = useState({
    company: "",
    title: "",
    location: "",
    url: "",
    jd: "",
  });
  const [busy, setBusy] = useState(false);

  const field =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function analyse() {
    if (!form.company || !form.title || !form.jd) {
      toast("⚠ Please fill in company, title and JD");
      return;
    }
    if (!profile.name || !profile.skills) {
      toast("⚠ Please complete your master profile first");
      return;
    }
    setBusy(true);
    toast(isAIConfigured(providers) ? "⏳ Analysing JD…" : "⏳ Keyword matching…");
    try {
      const analysis = await analyseJob(form, profile, providers);
      setAnalysis(analysis);
      toast("✓ Analysis complete");
    } catch (err) {
      toast("✕ Analysis failed: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const profileComplete =
    hydrated &&
    !!(profile.name && profile.title && profile.skills && profile.experience.length);
  const aiReady = hydrated && isAIConfigured(providers);

  return (
    <div className="p-8">
      <PageHeader
        title="🔍 Job Analysis"
        subtitle="Paste a job description to diagnose gaps and ATS issues before you start editing."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Labeled label="Company Name *">
              <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Tetra Tech" value={form.company} onChange={field("company")} />
            </Labeled>
            <Labeled label="Job Title *">
              <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="1st/2nd Line Support Analyst" value={form.title} onChange={field("title")} />
            </Labeled>
            <Labeled label="Location">
              <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Birmingham, UK" value={form.location} onChange={field("location")} />
            </Labeled>
            <Labeled label="Source URL (optional)">
              <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="https://…" value={form.url} onChange={field("url")} />
            </Labeled>
          </div>
          <Labeled label="Job Description *">
            <textarea
              rows={14}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              placeholder="Paste the full job description here…"
              value={form.jd}
              onChange={field("jd")}
            />
          </Labeled>
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, company: f.company || "Tetra Tech", title: f.title || "1st/2nd Line Support Analyst", location: f.location || "Birmingham, UK", jd: SAMPLE_JD }))}
              className="text-xs text-amber-600 hover:text-amber-600 dark:text-amber-400"
            >
              Load sample JD for testing
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ company: "", title: "", location: "", url: "", jd: "" })} className="btn-ghost px-4 py-2 rounded-lg text-sm">
                Clear
              </button>
              <button type="button" onClick={analyse} disabled={busy} className="btn-primary px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {busy ? <span className="spinner" /> : <Search className="w-4 h-4" />}
                Analyse
              </button>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Status</h2>
          <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex gap-2"><span>✅</span><span>Paste the full JD including responsibilities and requirements</span></div>
            <div className="flex gap-2"><span>✅</span><span>Keep your master profile up to date first</span></div>
            <div className="flex gap-2"><span>✅</span><span>Review the ATS safety scan before editing</span></div>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs text-amber-600 font-semibold mb-1 dark:text-amber-400">PROFILE STATUS</div>
            <div className="text-sm">
              {profileComplete ? (
                <span className="text-green-600 dark:text-green-400">✓ Ready to analyse</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">⚠ <Link href="/app/profile" className="underline">Profile incomplete</Link></span>
              )}
            </div>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="text-xs text-indigo-600 font-semibold mb-1 dark:text-indigo-400">AI PROVIDER</div>
            <div className="text-sm">
              {aiReady ? (
                <span className="text-green-600 dark:text-green-400">✓ {AI_PROVIDERS[providers.activeProvider].name}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">⚠ <Link href="/app/settings" className="underline">Not configured</Link> — keyword fallback</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {hydrated && currentAnalysis ? <Results analysis={currentAnalysis} /> : null}
    </div>
  );
}

function Results({ analysis: a }: { analysis: Analysis }) {
  const score = a.isSemantic
    ? a.overallFit
    : a.jdKeywords.length
      ? Math.round((a.matched.length / a.jdKeywords.length) * 100)
      : 0;
  const ring = score > 70 ? "#4ade80" : score > 40 ? "#fbbf24" : "#f87171";
  const C = 2 * Math.PI * 32;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
          Analysis Complete
          {a.isSemantic && a.senioritySignal ? (
            <span className="status-pill bg-purple-500/20 text-purple-700">{a.senioritySignal}</span>
          ) : null}
          {a.isSemantic
            ? a.domainTags.map((t) => (
                <span key={t} className="status-pill bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">{t}</span>
              ))
            : null}
        </h2>
        <Link href="/app/editor" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
          Enter Editing Room <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase mb-3 dark:text-slate-400">{a.isSemantic ? "Semantic Fit" : "Match Rate"}</div>
          <div className="flex items-center gap-4">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={ring} strokeWidth="8" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} transform="rotate(-90 40 40)" className="progress-ring" strokeLinecap="round" />
            </svg>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{score}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {a.isSemantic ? "Semantic fit" : `${a.matched.length} of ${a.jdKeywords.length} keywords matched`}
              </div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase mb-3 dark:text-slate-400">ATS Safety Scan</div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar">
            {a.atsWarnings.map((w, i) => (
              <div key={i} className={`ats-${w.type} rounded-lg p-3`}>
                <div className="text-xs font-semibold">
                  {w.type === "error" ? "🚨" : w.type === "warning" ? "⚠️" : "✓"} {w.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3 dark:text-slate-100">✓ Matched Concepts ({a.matched.length})</h3>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar">
            {a.matched.length ? (
              a.matched.map((m, i) => (
                <span key={i} className="chip chip-match" title={m.profileEvidence ? `Evidence: ${m.profileEvidence}` : undefined}>
                  {m.concept}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-sm dark:text-slate-400">None matched</span>
            )}
          </div>
        </div>
        <div className="card rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3 dark:text-slate-100">⚠ Areas to Strengthen</h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar">
            {a.isSemantic && a.gaps.length ? (
              a.gaps.map((g, i) => (
                <div key={i} className="p-2 rounded bg-red-500/10 border border-red-500/20 text-sm">
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    {g.concept} {g.importance ? <span className="text-xs text-slate-500 ml-1 dark:text-slate-400">({g.importance})</span> : null}
                  </div>
                  {g.suggestion ? <div className="text-xs text-slate-500 mt-1 dark:text-slate-400">{g.suggestion}</div> : null}
                </div>
              ))
            ) : !a.isSemantic && a.missing.length ? (
              a.missing.map((k, i) => <span key={i} className="chip chip-gap w-max">{k}</span>)
            ) : (
              <span className="text-slate-500 text-sm dark:text-slate-400">Great, no gaps found</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
