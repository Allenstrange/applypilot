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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="card rounded-xl p-6" data-testid="response-times">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Response times</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Average days between stages, from your status history.</p>
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Avg response" value={f.response.avgResponseDays} testid="stat-avg-response" />
                <MiniStat label="Applied → Interview" value={f.response.appliedToInterviewDays} testid="stat-applied-interview-days" />
                <MiniStat label="Interview → Offer" value={f.response.interviewToOfferDays} testid="stat-interview-offer-days" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                {f.response.sampleSize} application{f.response.sampleSize === 1 ? "" : "s"} with a recorded response
              </p>
            </div>

            <div className="card rounded-xl p-6 lg:col-span-2" data-testid="best-cv">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Resume performance</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Which resume gets you the most interviews. Link a CV to each application in the tracker.</p>
              {f.cvPerf.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Apply to a few roles to see which resume performs best.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 pr-4">Resume</th>
                        <th className="py-2 px-2">Applied</th>
                        <th className="py-2 px-2">Interview</th>
                        <th className="py-2 px-2">Offer</th>
                        <th className="py-2 pl-2">Interview rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.cvPerf.map((c, i) => (
                        <tr key={c.label} data-testid={`cv-perf-row-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">
                            {i === 0 ? <span className="mr-1" title="Top performer">🏆</span> : null}{c.label}
                          </td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-300">{c.applied}</td>
                          <td className="py-2 px-2 text-amber-600 dark:text-amber-400">{c.interview}</td>
                          <td className="py-2 px-2 text-green-600 dark:text-green-400">{c.offer}</td>
                          <td className="py-2 pl-2 font-semibold text-slate-900 dark:text-slate-100">{c.interviewRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

function MiniStat({ label, value, testid }: { label: string; value: number; testid: string }) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-center" data-testid={testid}>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value > 0 ? value : "–"}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 dark:text-slate-400">{label}</div>
      <div className="text-[10px] text-slate-400 h-3">{value > 0 ? "days" : ""}</div>
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
