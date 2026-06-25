import type { TemplateId } from "./types";

export type TemplateCategory = "simple" | "modern" | "creative" | "two-column";

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
  /** Page layout. Defaults to single column. */
  layout?: "single" | "sidebar";
  /** For sidebar layouts: tinted (light) or solid (accent-filled) sidebar. */
  sidebarStyle?: "tint" | "solid";
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
  {
    id: "profile",
    name: "Profile",
    description: "Two-column layout with a tinted teal sidebar for skills and contact.",
    accent: "#0d9488",
    header: "plain",
    font: "sans",
    layout: "sidebar",
    sidebarStyle: "tint",
    category: "two-column",
  },
  {
    id: "sage",
    name: "Sage",
    description: "Two-column with a soft sage-green sidebar. Calm and clean.",
    accent: "#15803d",
    header: "plain",
    font: "sans",
    layout: "sidebar",
    sidebarStyle: "tint",
    category: "two-column",
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Two-column with a solid slate sidebar. Striking and modern.",
    accent: "#1f2937",
    header: "plain",
    font: "sans",
    layout: "sidebar",
    sidebarStyle: "solid",
    category: "two-column",
  },
  {
    id: "noir",
    name: "Noir",
    description: "Solid charcoal sidebar paired with a serif main column.",
    accent: "#0f172a",
    header: "plain",
    font: "serif",
    layout: "sidebar",
    sidebarStyle: "solid",
    category: "two-column",
  },
];

export const CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "simple", label: "Simple" },
  { id: "modern", label: "Modern" },
  { id: "two-column", label: "Two-Column" },
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
