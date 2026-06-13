// ============== PDF EXPORT (jsPDF) ==============

import { jsPDF } from "jspdf";
import type { CoverLetter, ResumeSummary, Profile } from "./types";
import { slugify } from "./download";

interface TextOpts {
  size?: number;
  bold?: boolean;
  gap?: number;
  color?: [number, number, number];
}

function createWriter() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  function ensure(space: number) {
    if (y + space > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function text(str: string, opts: TextOpts = {}) {
    if (!str) return;
    const size = opts.size ?? 11;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const c = opts.color ?? [25, 25, 25];
    doc.setTextColor(c[0], c[1], c[2]);
    const lh = size * 1.35;
    for (const line of doc.splitTextToSize(str, maxW)) {
      ensure(lh);
      doc.text(line, margin, y);
      y += lh;
    }
    y += opts.gap ?? 0;
  }

  function heading(str: string) {
    y += 8;
    text(str, { size: 12, bold: true, gap: 2, color: [34, 34, 34] });
  }

  return { doc, text, heading, save: (f: string) => doc.save(f) };
}

export function exportCoverLetterPDF(cl: CoverLetter, company: string) {
  const w = createWriter();
  w.text(cl.subjectLine, { size: 13, bold: true, gap: 10 });
  w.text(cl.salutation, { gap: 8 });
  cl.body.forEach((p) => w.text(p, { gap: 8 }));
  w.text(cl.closing, { gap: 8 });
  w.text(cl.signOff, { gap: 0 });
  w.save(`${slugify(company)}_Cover_Letter.pdf`);
}

export function exportResumeSummaryPDF(rs: ResumeSummary, profile: Profile) {
  const w = createWriter();
  w.text(profile.name || "Resume Summary", { size: 18, bold: true, gap: 2 });
  w.text(rs.targetHeadline, { size: 12, bold: true, gap: 8, color: [80, 80, 80] });
  w.text(rs.introSummary, { gap: 8 });
  if (rs.bulletPoints.length) {
    w.heading("Highlights");
    rs.bulletPoints.forEach((b) => w.text("•  " + b, { gap: 4 }));
  }
  w.save(`${slugify(profile.name || "resume")}_Summary.pdf`);
}

export function exportCVPDF(profile: Profile) {
  const w = createWriter();
  w.text(profile.name || "Your Name", { size: 18, bold: true, gap: 0 });
  const line1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  if (line1) w.text(line1, { size: 10, gap: 0, color: [90, 90, 90] });
  const line2 = [profile.email, profile.phone, profile.linkedin]
    .filter(Boolean)
    .join("  |  ");
  if (line2) w.text(line2, { size: 10, gap: 6, color: [90, 90, 90] });

  if (profile.summary) {
    w.heading("Professional Summary");
    w.text(profile.summary, { gap: 6 });
  }
  if (profile.skills) {
    w.heading("Core Skills");
    w.text(profile.skills, { gap: 6 });
  }
  if (profile.experience.length) {
    w.heading("Professional Experience");
    profile.experience.forEach((exp) => {
      w.text(`${exp.role}${exp.company ? " — " + exp.company : ""}`, {
        size: 12,
        bold: true,
        gap: 0,
      });
      const dates = [exp.start, exp.end].filter(Boolean).join(" - ");
      if (dates) w.text(dates, { size: 10, gap: 2, color: [120, 120, 120] });
      exp.bullets
        .split("\n")
        .filter((b) => b.trim())
        .forEach((b) => w.text("•  " + b.replace(/^[-•]\s*/, ""), { gap: 2 }));
      if (exp.tools) w.text("Tools: " + exp.tools, { size: 10, gap: 6, color: [90, 90, 90] });
    });
  }
  if (profile.education.length) {
    w.heading("Education");
    profile.education.forEach((ed) => {
      w.text(ed.degree || ed.institution, { size: 12, bold: true, gap: 0 });
      const line = [ed.institution, ed.year].filter(Boolean).join(", ");
      if (line) w.text(line, { size: 10, gap: 4, color: [90, 90, 90] });
    });
  }
  if (profile.certs) {
    w.heading("Certifications");
    profile.certs
      .split("\n")
      .filter(Boolean)
      .forEach((c) => w.text("•  " + c.trim(), { gap: 2 }));
  }
  w.save(`${slugify(profile.name || "cv")}_CV.pdf`);
}
