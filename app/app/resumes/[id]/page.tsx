"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2, GripVertical, ChevronUp, ChevronDown, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { TEMPLATES, ACCENT_SWATCHES, DENSITY_LABELS, FONT_LABELS, DEFAULT_SECTION_ORDER, SECTION_LABELS, resolveTemplate } from "@/lib/templates";
import { exportResumePDF } from "@/lib/resumePdf";
import { buildShareUrl } from "@/lib/share";
import { toast } from "@/lib/toast";
import type { Profile, TemplateId, SectionKey } from "@/lib/types";
import ProfileFields from "@/components/ProfileFields";
import ResumePreview from "@/components/ResumePreview";
import ResumeScorePanel from "@/components/ResumeScorePanel";
import TemplateThumbnail from "@/components/TemplateThumbnail";

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

  const patchProfile = (patch: Partial<Profile>) =>
    updateResume(id, { profile: { ...resume.profile, ...patch } });

  const order: SectionKey[] = resume.sectionOrder?.length ? resume.sectionOrder : DEFAULT_SECTION_ORDER;
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
      await navigator.clipboard.writeText(url);
      toast("✓ Share link copied to clipboard");
    } catch {
      toast("Link: " + url);
    }
  }

  // Effective style (template defaults merged with this resume's customizations).
  const resolved = resolveTemplate(resume.templateId, {
    accent: resume.accent,
    font: resume.font,
    density: resume.density,
    headingUppercase: resume.headingUppercase,
    headingUnderline: resume.headingUnderline,
  });

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
        <div className="flex items-center gap-2">
          <Link
            href={`/app/analyze?base=${id}`}
            data-testid="tailor-to-job-btn"
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Target className="w-4 h-4" /> Tailor to a job
          </Link>
          <button
            type="button"
            onClick={shareLink}
            data-testid="share-resume-btn"
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share link
          </button>
          <button
            type="button"
            onClick={() => {
              exportResumePDF(
                resume.profile,
                resume.templateId,
                {
                  accent: resume.accent,
                  font: resume.font,
                  density: resume.density,
                  headingUppercase: resume.headingUppercase,
                  headingUnderline: resume.headingUnderline,
                },
                order,
              );
              toast("✓ PDF downloaded");
            }}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3 dark:text-slate-100">Template</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {TEMPLATES.map((t) => {
                const selected = resume.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateResume(id, { templateId: t.id as TemplateId })}
                    title={t.description}
                    className={`group rounded-lg border-2 p-1 transition-colors ${
                      selected
                        ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,transparent)]"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div className="rounded overflow-hidden border border-[var(--border)] bg-white">
                      <TemplateThumbnail profile={resume.profile} templateId={t.id} width={110} />
                    </div>
                    <span
                      className={`block text-[11px] font-medium mt-1.5 ${
                        selected ? "text-[var(--brand)]" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customize: accent colour + font */}
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3 dark:text-slate-100">Customize</div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs text-[var(--text-muted)] w-14">Colour</span>
              <button
                type="button"
                onClick={() => updateResume(id, { accent: undefined })}
                title="Use template default"
                className={`h-6 px-2 rounded-full text-[11px] border ${
                  !resume.accent ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border-strong)] text-[var(--text-muted)]"
                }`}
              >
                Default
              </button>
              {ACCENT_SWATCHES.map((c) => {
                const active = resume.accent === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateResume(id, { accent: c })}
                    aria-label={`Accent ${c}`}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${active ? "ring-2 ring-offset-2 ring-[var(--text)] ring-offset-[var(--surface)]" : ""}`}
                    style={{ background: c }}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[var(--text-muted)] w-14">Font</span>
              {FONT_LABELS.map((f) => {
                const effective = resolved.font;
                const active = effective === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateResume(id, { font: f.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs border-2 ${
                      active ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                    }`}
                    style={{ fontFamily: f.id === "serif" ? "Georgia, serif" : f.id === "mono" ? "monospace" : "inherit" }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[var(--text-muted)] w-14">Spacing</span>
              {DENSITY_LABELS.map((dn) => {
                const active = resolved.density === dn.id;
                return (
                  <button
                    key={dn.id}
                    type="button"
                    onClick={() => updateResume(id, { density: dn.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs border-2 ${
                      active ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {dn.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-14">Headings</span>
              <button
                type="button"
                onClick={() => updateResume(id, { headingUppercase: !resolved.headingUppercase })}
                className={`px-3 py-1.5 rounded-lg text-xs border-2 ${
                  resolved.headingUppercase ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                }`}
              >
                UPPERCASE
              </button>
              <button
                type="button"
                onClick={() => updateResume(id, { headingUnderline: !resolved.headingUnderline })}
                className={`px-3 py-1.5 rounded-lg text-xs border-2 ${
                  resolved.headingUnderline ? "border-[var(--brand)] text-[var(--brand)] underline" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                }`}
              >
                Underline
              </button>
            </div>
          </div>

          {/* Section order */}
          <div className="card rounded-xl p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-1 dark:text-slate-100">Section order</div>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">Drag, or use the arrows, to reorder résumé sections.</p>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] cursor-grab ${dragIndex === i ? "opacity-50" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
                  <span className="text-sm text-[var(--text)] flex-1">{SECTION_LABELS[key]}</span>
                  <button type="button" onClick={() => moveSection(i, i - 1)} disabled={i === 0} aria-label="Move up" className="text-[var(--text-faint)] hover:text-[var(--text)] disabled:opacity-30">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveSection(i, i + 1)} disabled={i === order.length - 1} aria-label="Move down" className="text-[var(--text-faint)] hover:text-[var(--text)] disabled:opacity-30">
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
          <div className="lg:sticky lg:top-6 space-y-6">
            <ResumeScorePanel profile={resume.profile} />
            <ResumePreview
              profile={resume.profile}
              templateId={resume.templateId}
              accent={resume.accent}
              font={resume.font}
              density={resume.density}
              headingUppercase={resume.headingUppercase}
              headingUnderline={resume.headingUnderline}
              sectionOrder={order}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
