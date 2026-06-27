"use client";

import Link from "next/link";
import { Search, User, ClipboardList, Settings, Target, Mic, Sparkles, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated, useNow } from "@/lib/useHydrated";
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const now = useNow();
  const applications = useStore((s) => s.applications);

  const apps = hydrated ? applications : [];
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications" value={stats.total} hint="all time" className="text-slate-900 dark:text-slate-100" />
        <StatCard label="Interviews" value={stats.interviews} hint={stats.interviews ? "in progress" : "none yet"} className="text-amber-600 dark:text-amber-400" />
        <StatCard label="Offers" value={stats.offers} hint={stats.offers ? "🎉 nice work" : "keep going"} className="text-green-600 dark:text-green-400" />
        <StatCard label="This Week" value={stats.week} hint="added this week" className="text-[var(--brand)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/app/analyze" primary icon={<Search className="w-4 h-4" />}>
              Analyse a New Job
            </QuickAction>
            <QuickAction href="/app/match" icon={<Target className="w-4 h-4" />}>
              Match &amp; Rank Jobs
            </QuickAction>
            <QuickAction href="/app/interview" icon={<Mic className="w-4 h-4" />}>
              Practise Mock Interview
            </QuickAction>
            <QuickAction href="/app/profile" icon={<User className="w-4 h-4" />}>
              Edit Master Profile
            </QuickAction>
            <QuickAction href="/app/tracker" icon={<ClipboardList className="w-4 h-4" />}>
              View All Applications
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
}: {
  label: string;
  value: number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className="card stat-card rounded-xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider dark:text-slate-400">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${className ?? ""}`}>{value}</div>
      {hint ? <div className="text-[11px] text-slate-400 mt-1 dark:text-slate-500">{hint}</div> : null}
    </div>
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
