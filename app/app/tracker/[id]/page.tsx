"use client";

// The Job Workspace: one page per tracked application where every artifact
// that belongs to the job meets — analysis, CV used, generated documents,
// score trend, contacts, next action, and notes.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  PenLine,
  FileText,
  Mic,
  Check,
  Minus,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { toast } from "@/lib/toast";
import type { Application, ApplicationStatus, Analysis, Generations } from "@/lib/types";
import MatchReportTable from "@/components/MatchReportTable";
import {
  STATUSES,
  NextActionEditor,
  ContactsPanel,
  Timeline,
} from "@/components/ApplicationPanels";

const DOC_LABELS: { key: keyof Generations; label: string }[] = [
  { key: "coverLetter", label: "Cover letter" },
  { key: "resumeSummary", label: "Resume summary" },
  { key: "interviewPrep", label: "Interview prep" },
  { key: "ninetyDay", label: "30-60-90 day plan" },
  { key: "outreach", label: "Recruiter outreach" },
];

export default function JobWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);
  const hydrated = useHydrated();
  const router = useRouter();
  const app = useStore((s) => s.applications.find((a) => a.id === appId));
  const setStatus = useStore((s) => s.setApplicationStatus);
  const loadApp = useStore((s) => s.loadApplication);
  const setAnalysis = useStore((s) => s.setAnalysis);
  const resumes = useStore((s) => s.resumes);

  if (!hydrated) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">Loading…</div>;
  }
  if (!app) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div>Application not found.</div>
        <Link href="/app/tracker" className="btn-primary px-4 py-2 rounded-lg text-sm mt-4 inline-block">
          Back to tracker
        </Link>
      </div>
    );
  }

  const cvUsed = app.resumeId ? resumes.find((r) => r.id === app.resumeId) : undefined;
  const snapshot = app.snapshot;

  function appToAnalysis(a: Application): Analysis {
    return {
      company: a.company, title: a.title, location: a.location ?? "", url: a.url ?? "",
      jd: "", jdKeywords: [], matched: [], missing: [], gaps: [], overallFit: 0,
      senioritySignal: "", domainTags: [], atsWarnings: [], isSemantic: false,
    };
  }

  // Optionally deep-link straight to the relevant Tailor tab (e.g. coverLetter).
  function continueTailoring(tab?: string) {
    if (loadApp(app!.id)) {
      router.push(tab ? `/app/editor?tab=${tab}` : "/app/editor");
    } else {
      toast("ℹ No saved tailoring session for this application");
    }
  }

  function prepInterview() {
    if (!loadApp(app!.id)) setAnalysis(appToAnalysis(app!));
    router.push("/app/interview");
  }

  return (
    <div className="p-8" data-testid="job-workspace">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            href="/app/tracker"
            aria-label="Back to tracker"
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 mt-1.5 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[22px] leading-7 font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {app.title}
            </h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-700 dark:text-slate-200">{app.company}</span>
              {app.location ? <span>· {app.location}</span> : null}
              <span>· added {new Date(app.createdAt).toLocaleDateString("en-GB")}</span>
              {app.url ? (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5"
                >
                  Posting <ArrowUpRight className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <select
          value={app.status}
          onChange={(e) => {
            setStatus(app.id, e.target.value as ApplicationStatus);
            toast("✓ Status updated");
          }}
          data-testid="workspace-status"
          aria-label="Application status"
          className={`text-sm px-3 py-1.5 rounded-lg status-pill status-${app.status}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Pipeline actions for this specific job */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => continueTailoring()}
          data-testid="ws-continue"
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <PenLine className="w-4 h-4" /> Continue tailoring
        </button>
        {cvUsed ? (
          <Link
            href={`/app/resumes/${cvUsed.id}`}
            data-testid="ws-open-cv"
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> {cvUsed.name}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={prepInterview}
          data-testid="ws-prep"
          className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Mic className="w-4 h-4" /> Prep interview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: the job's analysis + documents */}
        <div className="lg:col-span-2 space-y-6">
          {snapshot ? (
            <div className="card rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Match Report</h2>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                The CV saved with this application vs the job description. Continue tailoring to improve it.
              </p>
              <MatchReportTable
                jd={snapshot.analysis.jd}
                keywords={snapshot.analysis.jdKeywords}
                profile={snapshot.draftCV}
              />
            </div>
          ) : (
            <div className="card rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No saved analysis for this application.{" "}
              <Link href="/app/analyze" className="text-[var(--brand)] hover:underline">
                Analyse the job
              </Link>{" "}
              and save it from Tailor to see the match report here.
            </div>
          )}

          {app.interviews?.length ? (
            <div className="card rounded-xl p-5" data-testid="ws-interviews">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Interview practice ({app.interviews.length})
              </h2>
              <ul className="space-y-2">
                {app.interviews.map((s, i) => {
                  const color = s.avgScore >= 75 ? "text-green-600 dark:text-green-400" : s.avgScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Mic className="w-4 h-4 text-[var(--brand)] shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200">
                        {s.turns.length} question{s.turns.length === 1 ? "" : "s"} answered
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(s.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                      <span className={`ml-auto font-bold tabular-nums ${color}`}>{s.avgScore}/100</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="card rounded-xl p-5" data-testid="ws-documents">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Documents</h2>
            <ul className="space-y-2">
              {DOC_LABELS.map(({ key, label }) => {
                const exists = !!snapshot?.generations?.[key];
                return (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    {exists ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" aria-label="Generated" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" aria-label="Not generated" />
                    )}
                    <span className={exists ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => continueTailoring(key)}
                      className="ml-auto text-xs text-[var(--brand)] hover:underline"
                    >
                      {exists ? "Open" : "Generate"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: momentum — next action, contacts, timeline */}
        <div className="space-y-6">
          <div className="card rounded-xl p-5">
            <NextActionEditor app={app} />
            <ContactsPanel app={app} />
          </div>
          <div className="card rounded-xl p-5">
            <Timeline app={app} />
          </div>
        </div>
      </div>
    </div>
  );
}
