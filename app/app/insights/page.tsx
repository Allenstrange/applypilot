"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { TrendingUp, Send, Users, Award, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated, useNow } from "@/lib/useHydrated";
import { computeFunnel } from "@/lib/insights";
import PageHeader from "@/components/PageHeader";

const STAGES: {
  key: "planned" | "applied" | "interview" | "offer";
  label: string;
  color: string;
  icon: typeof Send;
}[] = [
  { key: "planned", label: "Planned", color: "#64748b", icon: TrendingUp },
  { key: "applied", label: "Applied", color: "#6366f1", icon: Send },
  { key: "interview", label: "Interview", color: "#f59e0b", icon: Users },
  { key: "offer", label: "Offer", color: "#22c55e", icon: Award },
];

export default function InsightsPage() {
  const hydrated = useHydrated();
  const now = useNow();
  const applications = useStore((s) => s.applications);
  const apps = hydrated ? applications : [];
  const f = computeFunnel(apps, now);

  return (
    <div className="p-8" data-testid="insights-page">
      <PageHeader
        title="📈 Insights"
        subtitle="Track how your applications convert from planned all the way to offer."
      />

      {apps.length === 0 ? (
        <div className="card rounded-xl p-12 text-center text-slate-500 dark:text-slate-400" data-testid="insights-empty">
          No data yet. Add jobs from the{" "}
          <Link href="/app/match" className="text-indigo-600 underline dark:text-indigo-400">Job Matcher</Link>{" "}
          or save analyses to the tracker to see your funnel.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat label="Total" value={f.total} color="text-slate-900 dark:text-slate-100" />
            <Stat label="Active" value={f.active} color="text-indigo-600 dark:text-indigo-400" />
            <Stat label="Interviews" value={f.byStatus.interview} color="text-amber-600 dark:text-amber-400" />
            <Stat label="Offers" value={f.byStatus.offer} color="text-green-600 dark:text-green-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel */}
            <div className="card rounded-xl p-6 lg:col-span-2" data-testid="funnel">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">Conversion funnel</h2>
              <div className="space-y-4">
                {STAGES.map((st, i) => {
                  const count = f.reached[st.key];
                  const width = f.total ? Math.max(6, Math.round((count / f.total) * 100)) : 0;
                  const Icon = st.icon;
                  return (
                    <div key={st.key} data-testid={`funnel-${st.key}`}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Icon className="w-4 h-4" style={{ color: st.color }} /> {st.label}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {count}
                          <span className="text-xs text-slate-400 ml-1">
                            {f.total ? `· ${Math.round((count / f.total) * 100)}%` : ""}
                          </span>
                        </span>
                      </div>
                      <div className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className="h-full rounded-lg"
                          style={{ background: st.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {f.rejected > 0 ? (
                <div className="flex items-center gap-2 mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <XCircle className="w-4 h-4 text-red-400" />
                  {f.rejected} rejected
                </div>
              ) : null}
            </div>

            {/* Conversion rates */}
            <div className="space-y-4">
              <Rate label="Applied → Interview" value={f.conv.appliedToInterview} color="#f59e0b" testid="rate-applied-interview" />
              <Rate label="Interview → Offer" value={f.conv.interviewToOffer} color="#22c55e" testid="rate-interview-offer" />
              <Rate label="Overall offer rate" value={f.conv.offerRate} color="#6366f1" testid="rate-offer" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card stat-card rounded-xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider dark:text-slate-400">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}

function Rate({ label, value, color, testid }: { label: string; value: number; color: string; testid: string }) {
  const C = 2 * Math.PI * 26;
  return (
    <div className="card rounded-xl p-5 flex items-center gap-4" data-testid={testid}>
      <div className="relative w-16 h-16 shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="7" />
          <motion.circle
            cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={C} initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - value / 100) }}
            transition={{ duration: 0.7 }}
            transform="rotate(-90 32 32)" strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
          {value}%
        </div>
      </div>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
    </div>
  );
}
