// ============== TEMPLATE-AWARE RESUME PDF (jsPDF) ==============

import { jsPDF } from "jspdf";
import type { Profile, TemplateId } from "./types";
import { getTemplate } from "./templates";
import { slugify } from "./download";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function exportResumePDF(profile: Profile, templateId: TemplateId) {
  const tpl = getTemplate(templateId);
  const accent = hexToRgb(tpl.accent);
  const bodyFont = tpl.font === "serif" ? "times" : "helvetica";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = tpl.id === "compact" ? 44 : 54;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  const lh = tpl.id === "compact" ? 1.28 : 1.38;
  let y = margin;

  const ensure = (space: number) => {
    if (y + space > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    str: string,
    opts: { size?: number; bold?: boolean; gap?: number; color?: [number, number, number]; font?: string } = {},
  ) => {
    if (!str) return;
    const size = opts.size ?? 10.5;
    doc.setFont(opts.font ?? bodyFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const c = opts.color ?? [30, 30, 30];
    doc.setTextColor(c[0], c[1], c[2]);
    const line = size * lh;
    for (const ln of doc.splitTextToSize(str, maxW)) {
      ensure(line);
      doc.text(ln, margin, y);
      y += line;
    }
    y += opts.gap ?? 0;
  };

  const heading = (label: string) => {
    y += tpl.id === "compact" ? 6 : 10;
    ensure(20);
    doc.setFont(bodyFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(label.toUpperCase(), margin, y);
    y += 5;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(tpl.header === "plain" ? 0.5 : 1.2);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  // ----- Header -----
  const contact1 = [profile.title, profile.location].filter(Boolean).join("   |   ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("   |   ");

  if (tpl.header === "band") {
    const bandH = 88;
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, pageW, bandH, "F");
    doc.setFont(bodyFont, "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(profile.name || "Your Name", margin, 40);
    doc.setFont(bodyFont, "normal");
    doc.setFontSize(10);
    if (contact1) doc.text(contact1, margin, 58);
    if (contact2) doc.text(contact2, margin, 72);
    y = bandH + 22;
  } else {
    write(profile.name || "Your Name", { size: 20, bold: true, gap: 2, color: [17, 24, 39] });
    if (contact1) write(contact1, { size: 9.5, gap: 0, color: [90, 90, 90] });
    if (contact2) write(contact2, { size: 9.5, gap: 4, color: [90, 90, 90] });
    if (tpl.header === "rule") {
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    }
  }

  // ----- Body -----
  if (profile.summary) {
    heading("Professional Summary");
    write(profile.summary, { gap: 4 });
  }
  if (profile.skills) {
    heading("Core Skills");
    write(profile.skills, { gap: 4 });
  }
  if (profile.experience.length) {
    heading("Professional Experience");
    profile.experience.forEach((exp) => {
      write(`${exp.role}${exp.company ? "  —  " + exp.company : ""}`, { size: 11, bold: true, gap: 0 });
      const dates = [exp.start, exp.end].filter(Boolean).join(" – ");
      if (dates) write(dates, { size: 9, gap: 2, color: [120, 120, 120] });
      exp.bullets
        .split("\n")
        .map((b) => b.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean)
        .forEach((b) => write("•  " + b, { gap: 1.5 }));
      if (exp.tools) write("Tools: " + exp.tools, { size: 9, gap: 6, color: [90, 90, 90] });
    });
  }
  if (profile.education.length) {
    heading("Education");
    profile.education.forEach((ed) => {
      write(ed.degree || ed.institution, { size: 10.5, bold: true, gap: 0 });
      const line = [ed.institution, ed.year].filter(Boolean).join(", ");
      if (line) write(line, { size: 9.5, gap: 4, color: [90, 90, 90] });
    });
  }
  if (profile.certs) {
    heading("Certifications");
    profile.certs
      .split("\n")
      .filter(Boolean)
      .forEach((c) => write("•  " + c.trim(), { gap: 1.5 }));
  }

  doc.save(`${slugify(profile.name || "resume")}_${tpl.id}.pdf`);
}
