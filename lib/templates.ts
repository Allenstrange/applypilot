import type { TemplateId, SectionKey } from "./types";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  /** Accent colour used for headings / header band. */
  accent: string;
  /** Header treatment in the PDF/preview. */
  header: "plain" | "band" | "rule";
  /** Body font family. */
  font: "serif" | "sans";
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Timeless single column with serif headings. ATS-safe.",
    accent: "#111827",
    header: "rule",
    font: "serif",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Indigo accent header band and section accents.",
    accent: "#4f46e5",
    header: "band",
    font: "sans",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense layout that fits more on one page.",
    accent: "#0f766e",
    header: "plain",
    font: "sans",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Polished serif with a clean rule. Senior roles.",
    accent: "#1e3a5f",
    header: "rule",
    font: "serif",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean, no lines. Lets the content breathe.",
    accent: "#0f172a",
    header: "plain",
    font: "sans",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold cyan header band. Design & marketing roles.",
    accent: "#0891b2",
    header: "band",
    font: "sans",
  },
];

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** Curated accent swatches for the design-control colour picker. */
export const ACCENT_SWATCHES: string[] = [
  "#111827", "#1e3a5f", "#4f46e5", "#0891b2", "#0f766e",
  "#b91c1c", "#c2410c", "#7c3aed", "#be185d", "#15803d",
];

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "skills",
  "experience",
  "education",
  "certs",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Professional Summary",
  skills: "Core Skills",
  experience: "Professional Experience",
  education: "Education",
  certs: "Certifications",
};
