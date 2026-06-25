"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useStore, emptyProfile } from "@/lib/store";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";
import type { TemplateCategory } from "@/lib/templates";
import { SAMPLE_PERSONAS, getPersona } from "@/lib/sampleResumes";
import { toast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import TemplateThumbnail from "@/components/TemplateThumbnail";

export default function TemplatesPage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const addResume = useStore((s) => s.addResume);
  const [personaId, setPersonaId] = useState(SAMPLE_PERSONAS[0].id);
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const persona = getPersona(personaId);
  const shown = category === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  function applyTemplate(templateId: (typeof TEMPLATES)[number]["id"]) {
    const base = profile.name ? profile : emptyProfile;
    const copy = JSON.parse(JSON.stringify(base));
    const name = profile.name ? `${profile.name.split(" ")[0]}'s Resume` : "Untitled Resume";
    const id = addResume(name, templateId, copy);
    toast("✓ Resume created");
    router.push(`/app/resumes/${id}`);
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <PageHeader
          title="Templates"
          subtitle="Browse layouts, preview them with a sample role, then make one yours."
        />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Preview as</span>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm font-medium"
          >
            {SAMPLE_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.role}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <div key={t.id} className="card rounded-xl p-4 flex flex-col">
            <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-white flex justify-center">
              <TemplateThumbnail profile={persona.profile} templateId={t.id} width={300} />
            </div>
            <div className="flex items-start justify-between gap-2 mt-4">
              <div>
                <div className="font-semibold text-[var(--text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{t.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => applyTemplate(t.id)}
              className="btn-primary mt-4 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Use this template
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--text-faint)] mt-6">
        Previews use sample data for the selected role. “Use this template” creates a
        resume from your master profile so you can start editing right away.
      </p>
    </div>
  );
}
