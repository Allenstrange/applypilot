"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Trash2, FolderOpen, ClipboardList, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { downloadText } from "@/lib/download";
import { toast } from "@/lib/toast";
import type { Application, ApplicationStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

const COLUMNS: { id: ApplicationStatus; label: string; hint: string; dot: string }[] = [
  { id: "planned", label: "Planned", hint: "Saved to apply to", dot: "#64748b" },
  { id: "applied", label: "Applied", hint: "Awaiting a response", dot: "#2563eb" },
  { id: "interview", label: "Interview", hint: "In the process", dot: "#d97706" },
  { id: "offer", label: "Offer", hint: "Negotiating / decided", dot: "#16a34a" },
  { id: "rejected", label: "Rejected", hint: "Closed out", dot: "#dc2626" },
];

export default function TrackerPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const applications = useStore((s) => s.applications);
  const setStatus = useStore((s) => s.setApplicationStatus);
  const removeApp = useStore((s) => s.removeApplication);
  const loadApp = useStore((s) => s.loadApplication);

  const apps = hydrated ? applications : [];

  function exportCSV() {
    if (apps.length === 0) {
      toast("⚠ No applications to export");
      return;
    }
    // Neutralise spreadsheet formula injection: a leading =,+,-,@ makes Excel /
    // Sheets evaluate the cell, so prefix those with a single quote.
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <PageHeader title="Application Tracker" subtitle="Move applications across your pipeline as you go." />
        <button type="button" onClick={exportCSV} className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {!hydrated ? null : apps.length === 0 ? (
        <div className="card rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
            <ClipboardList className="w-6 h-6 text-[var(--brand)]" />
          </div>
          <div className="font-medium text-slate-900 dark:text-slate-100">No applications yet</div>
          <p className="text-sm text-slate-500 mt-1 mb-4 dark:text-slate-400">
            Analyse a job and save it from the Editing Room to start tracking your pipeline.
          </p>
          <Link href="/app/analyze" className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold">
            Analyse a job <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colApps = apps.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="w-72 shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{col.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{colApps.length}</span>
                </div>
                <div className="space-y-3 min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                  {colApps.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">{col.hint}</p>
                  ) : (
                    colApps.map((app) => (
                      <TrackerCard
                        key={app.id}
                        app={app}
                        onMove={(s) => { setStatus(app.id, s); toast("✓ Moved"); }}
                        onOpen={() => openApp(app.id)}
                        onDelete={() => { removeApp(app.id); toast("✓ Deleted"); }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackerCard({
  app,
  onMove,
  onOpen,
  onDelete,
}: {
  app: Application;
  onMove: (s: ApplicationStatus) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-sm">
      <div className="font-medium text-slate-900 text-sm dark:text-slate-100">{app.title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{app.company}</div>
      <div className="text-[11px] text-slate-400 mt-1 dark:text-slate-500">
        {[app.location, new Date(app.createdAt).toLocaleDateString("en-GB")].filter(Boolean).join(" · ")}
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[var(--border)]">
        <select
          value={app.status}
          onChange={(e) => onMove(e.target.value as ApplicationStatus)}
          aria-label="Move to"
          className="text-[11px] px-1.5 py-1 rounded border border-[var(--border-strong)] bg-transparent"
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {app.snapshot ? (
            <button type="button" onClick={onOpen} title="Reload saved generations" className="text-[var(--brand)] hover:opacity-80">
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button type="button" onClick={onDelete} title="Delete" className="text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
