"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, Copy, Trash2, GitCompare, Plus, LayoutTemplate, Upload, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { scoreResume } from "@/lib/resumeScore";
import { getTemplate } from "@/lib/templates";
import { isAIConfigured } from "@/lib/ai";
import { parseCVFile } from "@/lib/cvParser";
import { toast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import TemplateThumbnail from "@/components/TemplateThumbnail";

export default function ResumesPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const resumes = useStore((s) => s.resumes);
  const profile = useStore((s) => s.profile);
  const providers = useStore((s) => s.providers);
  const addResume = useStore((s) => s.addResume);
  const duplicateResume = useStore((s) => s.duplicateResume);
  const removeResume = useStore((s) => s.removeResume);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function createFromProfile() {
    const copy = JSON.parse(JSON.stringify(profile));
    const name = profile.name ? `${profile.name.split(" ")[0]}'s Resume` : "My Resume";
    const id = addResume(name, "classic", copy);
    router.push(`/app/resumes/${id}`);
  }

  // Upload a CV file and save it as its own new resume in the library.
  async function handleUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("⚠ File too large (max 10MB)");
      return;
    }
    const ai = isAIConfigured(providers);
    setUploading(true);
    toast(ai ? "⏳ AI is reading your CV…" : `⏳ Reading ${file.name}…`);
    try {
      const { profile: parsed, source } = await parseCVFile(file, providers, ai);
      const base = file.name.replace(/\.[^.]+$/, "").trim();
      const name = parsed.name?.trim()
        ? `${parsed.name.split(" ")[0]}'s CV`
        : base || "Imported CV";
      const id = addResume(name, "classic", parsed);
      toast(
        source === "local"
          ? "ℹ Saved a blank resume — add an AI key in Settings for full extraction"
          : "✓ CV imported as a new resume",
      );
      router.push(`/app/resumes/${id}`);
    } catch (err) {
      toast("✕ " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const list = hydrated ? resumes : [];

  return (
    <div className="p-8">
      {/* shared hidden file input for all "Upload CV" entry points */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".docx,.pdf,.json,.txt"
        onChange={(e) => {
          handleUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <PageHeader title="Resumes" subtitle="Upload, build, and keep a tailored CV for every role." />
        <div className="flex items-center gap-2">
          {resumes.length >= 1 ? (
            <Link href="/app/compare" data-testid="compare-link" className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <GitCompare className="w-4 h-4" /> Compare
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="upload-cv-btn"
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {uploading ? <span className="spinner" /> : <Upload className="w-4 h-4" />} Upload CV
          </button>
          <button type="button" onClick={createFromProfile} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <FilePlus2 className="w-4 h-4" /> New resume
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card rounded-2xl p-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">How do you want to start?</h2>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Build a tailored resume in whichever way suits you.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group rounded-xl border border-[var(--border)] hover:border-[var(--brand)] p-6 text-center transition-colors disabled:opacity-60"
            >
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                {uploading ? (
                  <span className="spinner" />
                ) : (
                  <Upload className="w-6 h-6 text-[var(--brand)]" />
                )}
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Upload a CV</div>
              <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">DOCX, PDF, JSON or TXT — saved as a new resume.</p>
            </button>
            <button
              type="button"
              onClick={createFromProfile}
              className="group rounded-xl border border-[var(--border)] hover:border-[var(--brand)] p-6 text-center transition-colors"
            >
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                <Plus className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Start from your profile</div>
              <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">Build a resume from your master profile.</p>
            </button>
            <Link
              href="/app/templates"
              className="group rounded-xl border border-[var(--border)] hover:border-[var(--brand)] p-6 text-center transition-colors"
            >
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                <LayoutTemplate className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Browse templates</div>
              <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">Pick a design, then make it yours.</p>
            </Link>
            <Link
              href="/app/analyze"
              className="group rounded-xl border border-[var(--border)] hover:border-[var(--brand)] p-6 text-center transition-colors"
            >
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                <Target className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Tailor to a job</div>
              <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">Paste a job description and tailor a CV to it.</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const score = scoreResume(r.profile).overall;
            const tpl = getTemplate(r.templateId);
            const scoreColor = score >= 80 ? "text-green-600" : score >= 55 ? "text-amber-600" : "text-red-600";
            return (
              <div key={r.id} className="card rounded-xl overflow-hidden flex flex-col group">
                <Link
                  href={`/app/resumes/${r.id}`}
                  aria-label={`Open ${r.name}`}
                  className="relative block h-44 overflow-hidden bg-slate-50 dark:bg-slate-800/40 border-b border-[var(--border)] flex justify-center"
                >
                  <div className="pt-4 transition-transform duration-300 group-hover:-translate-y-1">
                    <TemplateThumbnail profile={r.profile} templateId={r.templateId} width={240} className="shadow-sm" />
                  </div>
                  <span
                    title="Resume score"
                    className={`absolute top-2.5 right-2.5 text-xs font-bold px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] ${scoreColor}`}
                  >
                    {score}
                  </span>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link href={`/app/resumes/${r.id}`}>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate">{r.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="w-2 h-2 rounded-full" style={{ background: tpl.accent }} />
                        {tpl.name}
                      </span>
                      <span>· {new Date(r.updatedAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <Link href={`/app/resumes/${r.id}`} className="text-violet-600 text-xs font-medium hover:text-violet-700 dark:text-violet-400">
                    Edit
                  </Link>
                  <Link
                    href={`/app/analyze?base=${r.id}`}
                    data-testid={`tailor-cv-${r.id}`}
                    title="Analyse a job and tailor this CV to it"
                    className="text-slate-500 text-xs hover:text-slate-700 flex items-center gap-1 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <Target className="w-3.5 h-3.5" /> Tailor
                  </Link>
                  <button
                    type="button"
                    onClick={() => { const id = duplicateResume(r.id); if (id) toast("✓ Duplicated"); }}
                    className="text-slate-500 text-xs hover:text-slate-700 flex items-center gap-1 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeResume(r.id); toast("✓ Deleted"); }}
                    className="text-red-600 text-xs hover:text-red-700 flex items-center gap-1 ml-auto dark:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
