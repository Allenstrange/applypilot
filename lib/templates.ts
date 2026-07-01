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

/** Distinct page layout engines — each renders differently on screen and PDF. */
export type TemplateLayout =
  | "classicClear" // centred serif header, thin-ruled headings, dates right
  | "sidebar" // dark left sidebar (contact + profile) with banner-bar main sections
  | "banded" // centred grey banded headings with a left date rail
  | "labelLeft" // section labels in a left column, content right
  | "headline" // maximal bold uppercase ATS style, heavy rules
  | "slate"; // clean sans, slate headings over hairline rules

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  /** Accent colour used for headings / sidebar. */
  accent: string;
  /** Which layout engine renders this template. */
  layout: TemplateLayout;
  /** Body font family. */
  font: "serif" | "sans" | "mono";
  /** Gallery grouping. */
  category: TemplateCategory;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "classic-clear",
    name: "Classic Clear",
    description: "Centred serif header, ruled sections, two-column skills. Timeless and ATS-safe.",
    accent: "#111111",
    layout: "classicClear",
    font: "serif",
    category: "simple",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Clean sans with slate headings over hairline rules. Quiet and professional.",
    accent: "#2d3e50",
    layout: "slate",
    font: "sans",
    category: "simple",
  },
  {
    id: "headline",
    name: "Headline",
    description: "Huge bold name, heavy rules, pure black. Maximum-impact ATS classic.",
    accent: "#000000",
    layout: "headline",
    font: "sans",
    category: "simple",
  },
  {
    id: "atlantic-blue",
    name: "Atlantic Blue",
    description: "Navy sidebar with your contact and profile; banner-bar sections on the right.",
    accent: "#253d52",
    layout: "sidebar",
    font: "sans",
    category: "modern",
  },
  {
    id: "mercury-flow",
    name: "Mercury Flow",
    description: "Banded section headers with a left date rail. Structured and scannable.",
    accent: "#3f4a55",
    layout: "banded",
    font: "sans",
    category: "modern",
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Editorial serif with section labels in the margin. Distinctive yet formal.",
    accent: "#8a8378",
    layout: "labelLeft",
    font: "serif",
    category: "creative",
  },
];

/** Map template ids from earlier releases to the closest new design. */
const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
  classic: "classic-clear",
  minimal: "slate",
  compact: "slate",
  modern: "mercury-flow",
  executive: "ledger",
  cobalt: "atlantic-blue",
  bold: "headline",
  ruby: "ledger",
};

/** Normalise any persisted template id (including pre-redesign ones). */
export function migrateTemplateId(id: string | undefined | null): TemplateId {
  if (id && TEMPLATES.some((t) => t.id === id)) return id as TemplateId;
  return LEGACY_TEMPLATE_MAP[id ?? ""] ?? "classic-clear";
}

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

export function getTemplate(id: TemplateId | string): TemplateDef {
  const resolved = migrateTemplateId(id);
  return TEMPLATES.find((t) => t.id === resolved) ?? TEMPLATES[0];
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
export function resolveTemplate(id: TemplateId | string, o?: StyleOverrides): ResolvedTemplate {
  const base = getTemplate(id);
  return {
    ...base,
    accent: o?.accent ?? base.accent,
    font: o?.font ?? base.font,
    density: o?.density ?? "normal",
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
