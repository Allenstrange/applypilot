"use client";

import { useRouter } from "next/navigation";
import { Download, Trash2, FolderOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { downloadText } from "@/lib/download";
import { toast } from "@/lib/toast";
import type { ApplicationStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

const STATUSES: ApplicationStatus[] = [
  "planned",
  "applied",
  "interview",
  "offer",
  "rejected",
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
    const rows = [["Company", "Role", "Location", "Status", "Date"]];
    apps.forEach((a) =>
      rows.push([
        a.company,
        a.title,
        a.location ?? "",
        a.status,
        new Date(a.createdAt).toLocaleDateString("en-GB"),
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
        <PageHeader title="Application Tracker" subtitle="All your job applications in one place." />
        <button type="button" onClick={exportCSV} className="btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="card rounded-xl overflow-hidden">
        {apps.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No applications tracked yet. Analyse a job and save it from the Editing Room.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:text-slate-400 dark:border-slate-700">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className="border-b border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{app.company}</td>
                    <td className="p-4">{app.title}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{app.location || "-"}</td>
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => {
                          setStatus(app.id, e.target.value as ApplicationStatus);
                          toast("✓ Updated");
                        }}
                        className={`text-xs px-2 py-1 rounded status-pill status-${app.status}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s[0].toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-slate-500 text-xs dark:text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {app.snapshot ? (
                          <button type="button" onClick={() => openApp(app.id)} className="text-amber-600 text-xs hover:text-amber-600 flex items-center gap-1 dark:text-amber-400" title="Reload saved generations">
                            <FolderOpen className="w-3.5 h-3.5" /> Open
                          </button>
                        ) : null}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
