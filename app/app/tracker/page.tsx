"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Trash2, PenLine, FileText, Mic, ChevronDown, ChevronRight, LayoutGrid, Table2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { downloadText } from "@/lib/download";
import { toast } from "@/lib/toast";
import type { Application, ApplicationStatus, Analysis } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import {
  STATUSES,
  STATUS_COLOR,
  NextActionChip,
  NextActionEditor,
  ContactsPanel,
  Timeline,
} from "@/components/ApplicationPanels";

export default function TrackerPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const applications = useStore((s) => s.applications);
  const setStatus = useStore((s) => s.setApplicationStatus);
  const removeApp = useStore((s) => s.removeApplication);
  const loadApp = useStore((s) => s.loadApplication);
  const setAnalysis = useStore((s) => s.setAnalysis);
  const resumes = useStore((s) => s.resumes);
  const setAppResume = useStore((s) => s.setApplicationResume);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [view, setView] = useState<"table" | "board">("table");
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  // Arriving from a dashboard stat card (?status=interview) pre-applies the filter.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && (STATUSES as string[]).includes(s)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL
      setFilter(s as ApplicationStatus);
    }
  }, []);

  const allApps = hydrated ? applications : [];
  const apps = filter === "all" ? allApps : allApps.filter((a) => a.status === filter);

  function exportCSV() {
    if (apps.length === 0) {
      toast("⚠ No applications to export");
      return;
    }
    const safe = (v: unknown) => {
      const s = String(v ?? "");
      return /^[=+\-@]/.test(s) ? `'${s}` : s;
    };
    const rows = [["Company", "Role", "Location", "Status", "Date"]];
    apps.forEach((a) =>
      rows.push([
        safe(a.company),
        safe(a.title),
        safe(a.location ?? ""),
        safe(a.status),
        safe(new Date(a.createdAt).toLocaleDateString("en-GB")),
      ]),
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadText("applications.csv", csv, "text/csv");
    toast("✓ CSV exported");
  }

  function openApp(id: number) {
    if (loadApp(id)) {
      router.push("/app/editor");
    } else {
      toast("ℹ No saved generations for this application");
    }
  }

  // Build a minimal analysis from a tracked row so the interview coach has the
  // role/company context even when the app has no saved editing snapshot.
  function appToAnalysis(app: Application): Analysis {
    return {
      company: app.company, title: app.title, location: app.location ?? "", url: app.url ?? "",
      jd: "", jdKeywords: [], matched: [], missing: [], gaps: [], overallFit: 0,
      senioritySignal: "", domainTags: [], atsWarnings: [], isSemantic: false,
    };
  }

  // Jump into a mock interview primed for this specific job.
  function prepInterview(app: Application) {
    if (!loadApp(app.id)) setAnalysis(appToAnalysis(app));
    router.push("/app/interview");
  }

  function renderKanban() {
    return (
      <div className="p-4 overflow-x-auto scrollbar snap-x" data-testid="kanban-board">
        <div className="flex gap-4 min-w-max">
          {STATUSES.map((st) => {
            const col = apps.filter((a) => a.status === st);
            return (
              <div
                key={st}
                onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== st) setDragOverCol(st); }}
                onDrop={() => {
                  if (dragId !== null) {
                    setStatus(dragId, st);
                    toast("✓ Moved to " + st);
                  }
                  setDragId(null);
                  setDragOverCol(null);
                }}
                data-testid={`kanban-col-${st}`}
                className="w-[78vw] sm:w-64 shrink-0 snap-start"
              >
                <div
                  className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg"
                  style={{ background: `color-mix(in srgb, ${STATUS_COLOR[st]} 14%, transparent)` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />
                  <span className="text-sm font-semibold capitalize" style={{ color: STATUS_COLOR[st] }}>{st}</span>
                  <span className="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">{col.length}</span>
                </div>
                <div className={`space-y-2 min-h-[64px] rounded-lg p-1.5 transition-colors ${dragOverCol === st && dragId !== null ? "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] ring-2 ring-[var(--brand)]" : "bg-slate-50 dark:bg-slate-800/40"}`}>
                  {col.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                      data-testid={`kanban-card-${app.id}`}
                      className={`card rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${dragId === app.id ? "opacity-50 scale-95" : ""}`}
                    >
                      <Link
                        href={`/app/tracker/${app.id}`}
                        className="font-medium text-sm text-slate-900 dark:text-slate-100 hover:text-[var(--brand)] hover:underline block"
                      >
                        {app.company}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{app.title}</div>
                      <NextActionChip app={app} />
                      {app.resumeName ? (
                        <div className="text-[10px] mt-1.5 inline-block px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] max-w-full truncate">
                          {app.resumeName}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex-wrap">
                        {app.snapshot ? (
                          <button type="button" onClick={() => openApp(app.id)} className="text-[var(--brand)] text-[11px] hover:underline">Continue</button>
                        ) : null}
                        {app.resumeId && resumes.some((r) => r.id === app.resumeId) ? (
                          <Link href={`/app/resumes/${app.resumeId}`} className="text-slate-600 text-[11px] hover:underline dark:text-slate-300">CV</Link>
                        ) : null}
                        <button type="button" onClick={() => prepInterview(app)} className="text-slate-600 text-[11px] hover:underline dark:text-slate-300">Prep</button>
                        <button type="button" onClick={() => { removeApp(app.id); toast("✓ Deleted"); }} className="text-red-600 text-[11px] hover:text-red-700 ml-auto dark:text-red-400">Delete</button>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 ? <div className="text-[11px] text-slate-400 text-center py-4">Drop here</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <PageHeader title="Application Tracker" subtitle="All your job applications in one place." />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button type="button" onClick={() => setView("table")} data-testid="view-table" className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "table" ? "bg-[var(--brand)] text-white" : "text-slate-500 dark:text-slate-400"}`}>
              <Table2 className="w-4 h-4" /> Table
            </button>
            <button type="button" onClick={() => setView("board")} data-testid="view-board" className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "board" ? "bg-[var(--brand)] text-white" : "text-slate-500 dark:text-slate-400"}`}>
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
          </div>
          <button type="button" onClick={exportCSV} data-testid="export-csv-btn" className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {allApps.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 mb-4" data-testid="tracker-filters">
          <button
            type="button"
            onClick={() => setFilter("all")}
            data-testid="filter-all"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === "all"
                ? "bg-[var(--brand)] border-[var(--brand)] text-white dark:text-slate-900"
                : "border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            All ({allApps.length})
          </button>
          {STATUSES.map((st) => {
            const n = allApps.filter((a) => a.status === st).length;
            const active = filter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(active ? "all" : st)}
                data-testid={`filter-${st}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  active
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white dark:text-slate-900"
                    : "border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
                }`}
                disabled={n === 0 && !active}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: active ? "currentColor" : STATUS_COLOR[st] }} />
                {st} ({n})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="card rounded-xl overflow-hidden">
        {allApps.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              No applications tracked yet. Analyse a job, tailor a CV, then save it here.
            </p>
            <Link
              href="/app/analyze"
              data-testid="tracker-empty-analyse"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold mt-4"
            >
              Analyse a job <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400" data-testid="tracker-filter-empty">
            No {filter} applications.{" "}
            <button type="button" onClick={() => setFilter("all")} className="text-[var(--brand)] hover:underline">
              Show all
            </button>
          </div>
        ) : view === "board" ? (
          renderKanban()
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:text-slate-400 dark:border-slate-700">
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">CV used</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <Fragment key={app.id}>
                    <tr className="border-b border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                          data-testid={`timeline-toggle-${app.id}`}
                          aria-label="Toggle timeline"
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {expanded === app.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/app/tracker/${app.id}`}
                          data-testid={`workspace-link-${app.id}`}
                          className="font-medium text-slate-900 dark:text-slate-100 hover:text-[var(--brand)] hover:underline"
                        >
                          {app.company}
                        </Link>
                        <div><NextActionChip app={app} /></div>
                      </td>
                      <td className="p-4">{app.title}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{app.location || "-"}</td>
                      <td className="p-4">
                        <select
                          value={app.status}
                          onChange={(e) => {
                            setStatus(app.id, e.target.value as ApplicationStatus);
                            toast("✓ Updated");
                          }}
                          data-testid={`status-select-${app.id}`}
                          className={`text-xs px-2 py-1 rounded status-pill status-${app.status}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={app.resumeId ?? ""}
                          onChange={(e) => {
                            setAppResume(app.id, e.target.value);
                            toast(e.target.value ? "✓ CV linked" : "✓ CV unlinked");
                          }}
                          data-testid={`resume-select-${app.id}`}
                          className="text-xs px-2 py-1 rounded-lg max-w-[160px] truncate"
                        >
                          <option value="">— None —</option>
                          {resumes.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                          {app.resumeId && !resumes.find((r) => r.id === app.resumeId) ? (
                            <option value={app.resumeId}>{app.resumeName ?? "Deleted resume"}</option>
                          ) : null}
                        </select>
                      </td>
                      <td className="p-4 text-slate-500 text-xs dark:text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          {app.snapshot ? (
                            <button type="button" onClick={() => openApp(app.id)} data-testid={`continue-${app.id}`} className="text-[var(--brand)] text-xs hover:underline flex items-center gap-1" title="Reload this tailoring session in the editor">
                              <PenLine className="w-3.5 h-3.5" /> Continue
                            </button>
                          ) : null}
                          {app.resumeId && resumes.some((r) => r.id === app.resumeId) ? (
                            <Link href={`/app/resumes/${app.resumeId}`} data-testid={`open-cv-${app.id}`} className="text-slate-600 text-xs hover:underline flex items-center gap-1 dark:text-slate-300" title="Open the CV used for this application">
                              <FileText className="w-3.5 h-3.5" /> Open CV
                            </Link>
                          ) : null}
                          <button type="button" onClick={() => prepInterview(app)} data-testid={`prep-${app.id}`} className="text-slate-600 text-xs hover:underline flex items-center gap-1 dark:text-slate-300" title="Practise a mock interview for this role">
                            <Mic className="w-3.5 h-3.5" /> Prep interview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              removeApp(app.id);
                              toast("✓ Deleted");
                            }}
                            className="text-red-600 text-xs hover:text-red-700 flex items-center gap-1 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === app.id ? (
                      <tr className="bg-slate-50 dark:bg-slate-900/40">
                        <td colSpan={8} className="px-6 pb-5 pt-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                            <Timeline app={app} />
                            <div className="pt-1">
                              <NextActionEditor app={app} />
                              <ContactsPanel app={app} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
