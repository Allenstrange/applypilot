"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2, FileType, GripVertical, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { TEMPLATES, ACCENT_SWATCHES, DEFAULT_SECTION_ORDER, SECTION_LABELS } from "@/lib/templates";
import { exportResumePDF } from "@/lib/resumePdf";
import { exportResumeDOCX } from "@/lib/docx";
import { buildShareUrl } from "@/lib/share";
import { copyToClipboard } from "@/lib/download";
import { toast } from "@/lib/toast";
import type { Profile, TemplateId, SectionKey } from "@/lib/types";
import ProfileFields from "@/components/ProfileFields";
import ResumePreview from "@/components/ResumePreview";
import ResumeScorePanel from "@/components/ResumeScorePanel";

export default function ResumeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const resume = useStore((s) => s.resumes.find((r) => r.id === id));
  const updateResume = useStore((s) => s.updateResume);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  const order: SectionKey[] = resume.sectionOrder?.length ? resume.sectionOrder : DEFAULT_SECTION_ORDER;
  const patchProfile = (patch: Partial<Profile>) =>
    updateResume(id, { profile: { ...resume.profile, ...patch } });

  function moveSection(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateResume(id, { sectionOrder: next });
  }

  async function shareLink() {
    if (!resume) return;
    const url = buildShareUrl(window.location.origin, resume.profile, resume.templateId);
    try {
      await copyToClipboard(url);
      toast("✓ Share link copied to clipboard");
    } catch {
      toast("Link: " + url);
    }
  }

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
            data-testid="resume-name-input"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={shareLink} data-testid="share-resume-btn" className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share link
          </button>
          <button
            type="button"
            onClick={() => { exportResumeDOCX(resume.profile, resume.templateId, resume.accent, order); toast("✓ Word downloaded"); }}
            data-testid="download-word-btn"
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <FileType className="w-4 h-4" /> Word
          </button>
          <button
            type="button"
            onClick={() => { exportResumePDF(resume.profile, resume.templateId, resume.accent, order); toast("✓ PDF downloaded"); }}
            data-testid="download-pdf-btn"
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          {/* Template */}
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3 dark:text-slate-100">Template</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateResume(id, { templateId: t.id as TemplateId })}
                  data-testid={`template-${t.id}`}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    resume.templateId === t.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="block w-full h-1.5 rounded-full mb-2" style={{ background: t.accent }} />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.name}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight dark:text-slate-400">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent colour */}
          <div className="card rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Accent colour</div>
              {resume.accent ? (
                <button type="button" onClick={() => updateResume(id, { accent: undefined })} data-testid="accent-reset" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 dark:text-slate-400">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateResume(id, { accent: c })}
                  data-testid={`accent-${c}`}
                  aria-label={`Accent ${c}`}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    (resume.accent || "") === c ? "border-slate-900 dark:border-white scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
              <label className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-600 grid place-items-center cursor-pointer overflow-hidden" title="Custom colour">
                <input
                  type="color"
                  value={resume.accent || "#4f46e5"}
                  onChange={(e) => updateResume(id, { accent: e.target.value })}
                  data-testid="accent-custom"
                  className="w-9 h-9 cursor-pointer opacity-0 absolute"
                />
                <span className="text-[10px] text-slate-400">+</span>
              </label>
            </div>
          </div>

          {/* Section order */}
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-1 dark:text-slate-100">Section order</div>
            <p className="text-[11px] text-slate-500 mb-3 dark:text-slate-400">Drag, or use the arrows, to reorder resume sections.</p>
            <div className="space-y-1.5">
              {order.map((key, i) => (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIndex !== null) moveSection(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                  data-testid={`section-row-${key}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-grab ${dragIndex === i ? "opacity-50" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{SECTION_LABELS[key]}</span>
                  <button type="button" onClick={() => moveSection(i, i - 1)} disabled={i === 0} data-testid={`section-up-${key}`} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-slate-200">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveSection(i, i + 1)} disabled={i === order.length - 1} data-testid={`section-down-${key}`} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-slate-200">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ProfileFields profile={resume.profile} onPatch={patchProfile} />
        </div>

        {/* Preview + score */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              ✏️ Tip: click any text in the preview below to edit it directly.
            </div>
            <ResumeScorePanel profile={resume.profile} />
            <ResumePreview
              profile={resume.profile}
              templateId={resume.templateId}
              accent={resume.accent}
              order={order}
              editable
              onPatch={patchProfile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
