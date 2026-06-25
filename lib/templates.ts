import type { TemplateId } from "./types";

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
];

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
