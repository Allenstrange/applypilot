import type { TemplateId, SectionKey } from "./types";

export type TemplateCategory = "simple" | "modern" | "creative";

/** Default resume section order (used by DOCX export and section controls). */
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

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  /** Accent colour used for headings / header band / sidebar. */
  accent: string;
  /** Header treatment in the PDF/preview. */
  header: "plain" | "band" | "rule";
  /** Body font family. */
  font: "serif" | "sans" | "mono";
  /** Gallery grouping. */
  category: TemplateCategory;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Timeless single column with serif headings. ATS-safe.",
    accent: "#111827",
    header: "rule",
    font: "serif",
    category: "simple",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean, no colour. Maximum ATS safety.",
    accent: "#0a0a0a",
    header: "plain",
    font: "sans",
    category: "simple",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense layout that fits more on one page.",
    accent: "#0f766e",
    header: "plain",
    font: "sans",
    category: "simple",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Violet accent header band and section rules.",
    accent: "#7c3aed",
    header: "band",
    font: "sans",
    category: "modern",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Serif body with a navy header band. Senior roles.",
    accent: "#1f3a5f",
    header: "band",
    font: "serif",
    category: "modern",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    description: "Crisp blue header band, corporate and confident.",
    accent: "#1d4ed8",
    header: "band",
    font: "sans",
    category: "modern",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Coral header band that stands out in a stack.",
    accent: "#fb6f4c",
    header: "band",
    font: "sans",
    category: "creative",
  },
  {
    id: "ruby",
    name: "Ruby",
    description: "Deep ruby band with a confident, editorial feel.",
    accent: "#be123c",
    header: "band",
    font: "serif",
    category: "creative",
  },
];

export const CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "simple", label: "Simple" },
  { id: "modern", label: "Modern" },
  { id: "creative", label: "Creative" },
];

/** Accent colours offered in the resume customization panel. */
export const ACCENT_SWATCHES = [
  "#7c3aed", // violet (brand)
  "#1d4ed8", // blue
  "#0891b2", // cyan
  "#0d9488", // teal
  "#15803d", // green
  "#ca8a04", // amber
  "#ea580c", // orange
  "#be123c", // ruby
  "#9333ea", // purple
  "#0f172a", // slate/ink
];

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ---------- Customization resolution ----------

export type Density = "compact" | "normal" | "relaxed";

export interface StyleOverrides {
  accent?: string;
  font?: "serif" | "sans" | "mono";
  density?: Density;
  headingUppercase?: boolean;
  headingUnderline?: boolean;
}

export interface ResolvedTemplate extends TemplateDef {
  density: Density;
  headingUppercase: boolean;
  headingUnderline: boolean;
}

/** Merge a template's defaults with per-resume customization overrides. */
export function resolveTemplate(id: TemplateId, o?: StyleOverrides): ResolvedTemplate {
  const base = getTemplate(id);
  return {
    ...base,
    accent: o?.accent ?? base.accent,
    font: o?.font ?? base.font,
    density: o?.density ?? (base.id === "compact" ? "compact" : "normal"),
    headingUppercase: o?.headingUppercase ?? true,
    headingUnderline: o?.headingUnderline ?? true,
  };
}

export const DENSITY_LABELS: { id: Density; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "normal", label: "Normal" },
  { id: "relaxed", label: "Relaxed" },
];

export const FONT_LABELS: { id: "sans" | "serif" | "mono"; label: string }[] = [
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];
