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
];

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
