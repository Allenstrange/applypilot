"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { decodeResume } from "@/lib/share";
import { exportResumePDF } from "@/lib/resumePdf";
import ResumePreview from "@/components/ResumePreview";
import type { Profile, TemplateId } from "@/lib/types";

export default function SharePage() {
  const [data, setData] = useState<{ profile: Profile; templateId: TemplateId } | null | undefined>(undefined);

  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    // One-time, client-only read of the URL hash on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(decodeResume(h));
  }, []);

  if (data === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6" data-testid="share-invalid">
        <div className="text-slate-500 dark:text-slate-400">This share link is invalid or empty.</div>
        <Link href="/" className="text-[var(--brand)] underline">Go to ApplyPilot</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white text-sm">AP</span>
            ApplyPilot
          </Link>
          <button
            type="button"
            onClick={() => exportResumePDF(data.profile, data.templateId)}
            data-testid="share-download-pdf"
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
        <div data-testid="share-resume">
          <ResumePreview profile={data.profile} templateId={data.templateId} />
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">Shared via ApplyPilot</p>
      </div>
    </div>
  );
}
