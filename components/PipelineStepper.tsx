"use client";

import Link from "next/link";
import { FileText, Search, PenLine, Download, ClipboardList, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PipelineStep = "cv" | "job" | "tailor" | "export" | "track";

interface StepDef {
  id: PipelineStep;
  label: string;
  icon: LucideIcon;
  href: string;
}

const STEPS: StepDef[] = [
  { id: "cv", label: "CV", icon: FileText, href: "/app/resumes" },
  { id: "job", label: "Job", icon: Search, href: "/app/analyze" },
  { id: "tailor", label: "Tailor", icon: PenLine, href: "/app/editor" },
  { id: "export", label: "Export", icon: Download, href: "/app/resumes" },
  { id: "track", label: "Track", icon: ClipboardList, href: "/app/tracker" },
];

/**
 * A compact, always-visible map of the application flow so users never have to
 * remember the order. Steps before the current one are "done" and clickable;
 * the current one is highlighted; later steps are dimmed but still navigable.
 */
export default function PipelineStepper({
  current,
  className = "",
}: {
  current: PipelineStep;
  className?: string;
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <nav
      aria-label="Application steps"
      className={`flex items-center gap-1 overflow-x-auto scrollbar ${className}`}
      data-testid="pipeline-stepper"
    >
      {STEPS.map((s, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "todo";
        const Icon = state === "done" ? Check : s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <Link
              href={s.href}
              aria-current={state === "current" ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                state === "current"
                  ? "bg-[var(--brand)] text-white dark:text-slate-900"
                  : state === "done"
                    ? "text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {s.label}
            </Link>
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden
                className={`w-4 h-px shrink-0 ${i < currentIdx ? "bg-[var(--brand)]/50" : "bg-[var(--border-strong)]"}`}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
