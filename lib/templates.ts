import type { TemplateId } from "./types";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  /** Accent colour used for headings / header band / sidebar. */
  accent: string;
  /** Header treatment in the PDF/preview. */
  header: "plain" | "band" | "rule";
  /** Body font family. */
  font: "serif" | "sans";
  /** Page layout. Defaults to single column. */
  layout?: "single" | "sidebar";
  /** For sidebar layouts: tinted (light) or solid (accent-filled) sidebar. */
  sidebarStyle?: "tint" | "solid";
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
    description: "Violet accent header band and section rules.",
    accent: "#7c3aed",
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
    description: "Serif body with a navy header band. Senior roles.",
    accent: "#1f3a5f",
    header: "band",
    font: "serif",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean, no colour. Maximum ATS safety.",
    accent: "#0a0a0a",
    header: "plain",
    font: "sans",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Coral header band that stands out in a stack.",
    accent: "#fb6f4c",
    header: "band",
    font: "sans",
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
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Two-column layout with a solid slate sidebar. Striking and modern.",
    accent: "#1f2937",
    header: "plain",
    font: "sans",
    layout: "sidebar",
    sidebarStyle: "solid",
  },
];

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
