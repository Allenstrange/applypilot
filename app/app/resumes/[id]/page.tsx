"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { TEMPLATES } from "@/lib/templates";
import { exportResumePDF } from "@/lib/resumePdf";
import { toast } from "@/lib/toast";
import type { Profile, TemplateId } from "@/lib/types";
import ProfileFields from "@/components/ProfileFields";
import ResumePreview from "@/components/ResumePreview";
import ResumeScorePanel from "@/components/ResumeScorePanel";

export default function ResumeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const resume = useStore((s) => s.resumes.find((r) => r.id === id));
  const updateResume = useStore((s) => s.updateResume);

  if (!hydrated) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">Loading…</div>;
  }

  if (!resume) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div>Resume not found.</div>
        <Link href="/app/resumes" className="btn-primary px-4 py-2 rounded-lg text-sm mt-4 inline-block">
          Back to resumes
        </Link>
      </div>
    );
  }

  const patchProfile = (patch: Partial<Profile>) =>
    updateResume(id, { profile: { ...resume.profile, ...patch } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/resumes" className="text-slate-400 hover:text-slate-600 shrink-0 dark:text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            value={resume.name}
            onChange={(e) => updateResume(id, { name: e.target.value })}
            className="text-xl font-bold text-slate-900 bg-transparent border-0 px-1 py-1 rounded focus:bg-white min-w-0 dark:text-slate-100"
            aria-label="Resume name"
          />
        </div>
        <button
          type="button"
          onClick={() => { exportResumePDF(resume.profile, resume.templateId); toast("✓ PDF downloaded"); }}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3 dark:text-slate-100">Template</div>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateResume(id, { templateId: t.id as TemplateId })}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    resume.templateId === t.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="block w-full h-1.5 rounded-full mb-2" style={{ background: t.accent }} />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.name}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight dark:text-slate-400">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
          <ProfileFields profile={resume.profile} onPatch={patchProfile} />
        </div>

        {/* Preview + score */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-6 space-y-6">
            <ResumeScorePanel profile={resume.profile} />
            <ResumePreview profile={resume.profile} templateId={resume.templateId} />
          </div>
        </div>
      </div>
    </div>
  );
}
