"use client";

import Link from "next/link";
import {
  Search,
  User,
  ClipboardList,
  Settings,
  Target,
  Mic,
  Sparkles,
  ArrowRight,
  FileText,
  Upload,
  Plus,
  PenLine,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated, useNow } from "@/lib/useHydrated";
import { scoreResume } from "@/lib/resumeScore";
import { getTemplate } from "@/lib/templates";
import PageHeader from "@/components/PageHeader";
import TemplateThumbnail from "@/components/TemplateThumbnail";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const now = useNow();
  const applications = useStore((s) => s.applications);
  const resumes = useStore((s) => s.resumes);
  const analysis = useStore((s) => s.currentAnalysis);
  const draftCV = useStore((s) => s.draftCV);

  const apps = hydrated ? applications : [];
  const cvs = hydrated ? resumes : [];
  const resume = hydrated && analysis && draftCV ? analysis : null;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const stats = {
    total: apps.length,
    interviews: apps.filter((a) => a.status === "interview").length,
    offers: apps.filter((a) => a.status === "offer").length,
    week: apps.filter((a) => new Date(a.createdAt).getTime() > weekAgo).length,
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Welcome back 👋"
        subtitle="Your AI-powered job application command centre."
      />

      {/* Resume the last tailoring session in one click. */}
      {resume ? (
        <Link
          href="/app/editor"
          data-testid="continue-card"
          className="group flex items-center gap-4 card rounded-xl p-5 mb-6 border-[var(--brand)]/40 hover:border-[var(--brand)] transition-colors"
        >
          <div className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]">
            <PenLine className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand)]">
              Continue where you left off
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              Tailoring {resume.title} at {resume.company}
            </div>
          </div>
          <span className="btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 shrink-0">
            Resume <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      ) : null}

      {/* CV-first shelf: your CVs are the unit of work, so they lead the page. */}
      <div className="card rounded-xl p-6 mb-6" data-testid="cv-shelf">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--brand)]" /> My CVs
          </h2>
          {cvs.length > 0 ? (
            <Link
              href="/app/resumes"
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              All CVs ({cvs.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null}
        </div>

        {cvs.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
              <Upload className="w-6 h-6 text-[var(--brand)]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                Start with your CV
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload an existing CV or build one — everything else (tailoring,
                scoring, tracking) works from it.
              </p>
            </div>
            <Link
              href="/app/resumes"
              data-testid="dash-add-cv"
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add your first CV
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cvs.slice(0, 3).map((r) => {
              const score = scoreResume(r.profile).overall;
              const tpl = getTemplate(r.templateId);
              const scoreColor =
                score >= 80 ? "text-green-600" : score >= 55 ? "text-amber-600" : "text-red-600";
              return (
                <Link
                  key={r.id}
                  href={`/app/resumes/${r.id}`}
                  className="group rounded-lg border border-[var(--border)] hover:border-[var(--brand)] overflow-hidden transition-colors"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-50 dark:bg-slate-800/40 border-b border-[var(--border)] flex justify-center">
                    <div className="pt-3 transition-transform duration-300 group-hover:-translate-y-1">
                      <TemplateThumbnail profile={r.profile} templateId={r.templateId} width={170} />
                    </div>
                    <span
                      title="Resume score"
                      className={`absolute top-2 right-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] ${scoreColor}`}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {r.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tpl.name} · {new Date(r.updatedAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications" value={stats.total} hint="all time" className="text-slate-900 dark:text-slate-100" href="/app/tracker" />
        <StatCard label="Interviews" value={stats.interviews} hint={stats.interviews ? "in progress" : "none yet"} className="text-amber-600 dark:text-amber-400" href="/app/tracker?status=interview" />
        <StatCard label="Offers" value={stats.offers} hint={stats.offers ? "🎉 nice work" : "keep going"} className="text-green-600 dark:text-green-400" href="/app/tracker?status=offer" />
        <StatCard label="This Week" value={stats.week} hint="added this week" className="text-[var(--brand)]" href="/app/tracker" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/app/resumes" primary icon={<FileText className="w-4 h-4" />}>
              Open My CVs
            </QuickAction>
            <QuickAction href="/app/analyze" icon={<Search className="w-4 h-4" />}>
              Analyse a New Job
            </QuickAction>
            <QuickAction href="/app/match" icon={<Target className="w-4 h-4" />}>
              Match &amp; Rank Jobs
            </QuickAction>
            <QuickAction href="/app/interview" icon={<Mic className="w-4 h-4" />}>
              Practise Mock Interview
            </QuickAction>
            <QuickAction href="/app/tracker" icon={<ClipboardList className="w-4 h-4" />}>
              View All Applications
            </QuickAction>
            <QuickAction href="/app/profile" icon={<User className="w-4 h-4" />}>
              Edit Master Profile
            </QuickAction>
            <QuickAction href="/app/settings" icon={<Settings className="w-4 h-4" />}>
              Configure AI Provider
            </QuickAction>
          </div>
        </div>

        <div className="card rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Recent Activity</h2>
          <div className="space-y-3 text-sm">
            {apps.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                  <Sparkles className="w-6 h-6 text-[var(--brand)]" />
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">No activity yet</div>
                <p className="text-slate-500 text-xs mt-1 mb-4 dark:text-slate-400">
                  Analyse your first job to start tailoring applications.
                </p>
                <Link
                  href="/app/analyze"
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Analyse your first job <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              apps.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <div>
                    <div className="font-medium text-slate-900 text-sm dark:text-slate-100">{a.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {a.company} •{" "}
                      {new Date(a.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <span className={`status-pill status-${a.status}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  className,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  className?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="group card stat-card rounded-xl p-5 block transition-colors hover:border-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
    >
      <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider dark:text-slate-400">
        {label}
        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--brand)]" />
      </div>
      <div className={`text-3xl font-bold mt-2 ${className ?? ""}`}>{value}</div>
      {hint ? <div className="text-[11px] text-slate-400 mt-1 dark:text-slate-500">{hint}</div> : null}
    </Link>
  );
}

function QuickAction({
  href,
  children,
  icon,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`w-full ${
        primary ? "btn-primary" : "btn-ghost"
      } py-3 px-4 rounded-lg text-sm font-medium flex items-center gap-2`}
    >
      {icon}
      {children}
    </Link>
  );
}
