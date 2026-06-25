// ============== TEMPLATE-AWARE RESUME PDF (jsPDF) ==============

import { jsPDF } from "jspdf";
import type { Profile, TemplateId } from "./types";
import { getTemplate, type TemplateDef } from "./templates";
import { slugify } from "./download";

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function parseBullets(str: string): string[] {
  return str.split("\n").map((b) => b.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
}

function parseList(str: string): string[] {
  return str.split(/[\n·|,]+/).map((s) => s.trim()).filter(Boolean);
}

export function exportResumePDF(
  profile: Profile,
  templateId: TemplateId,
  opts?: { accent?: string; font?: "serif" | "sans" },
) {
  const base = getTemplate(templateId);
  const tpl: TemplateDef = {
    ...base,
    ...(opts?.accent ? { accent: opts.accent } : {}),
    ...(opts?.font ? { font: opts.font } : {}),
  };
  if (tpl.layout === "sidebar") {
    sidebarPDF(profile, tpl);
  } else {
    singleColumnPDF(profile, tpl);
  }
}

// ---------------- Single-column ----------------

function singleColumnPDF(profile: Profile, tpl: TemplateDef) {
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
    opts: { size?: number; bold?: boolean; gap?: number; color?: RGB; font?: string } = {},
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
      parseBullets(exp.bullets).forEach((b) => write("•  " + b, { gap: 1.5 }));
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
    profile.certs.split("\n").filter(Boolean).forEach((c) => write("•  " + c.trim(), { gap: 1.5 }));
  }

  doc.save(`${slugify(profile.name || "resume")}_${tpl.id}.pdf`);
}

// ---------------- Two-column (sidebar) ----------------

function sidebarPDF(profile: Profile, tpl: TemplateDef) {
  const accent = hexToRgb(tpl.accent);
  const solid = tpl.sidebarStyle === "solid";
  const bodyFont = tpl.font === "serif" ? "times" : "helvetica";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const sidebarW = pageW * 0.34;
  const sidePad = 20;
  const sideX = sidePad;
  const sideW = sidebarW - sidePad * 2;
  const mainX = sidebarW + 26;
  const mainRight = pageW - 36;
  const mainW = mainRight - mainX;
  const topMargin = 36;
  const bottomMargin = 40;

  // Blend accent toward white for the tinted sidebar fill.
  const tintC = (c: number) => Math.round(255 * 0.91 + c * 0.09);
  const sideFill: RGB = solid ? accent : [tintC(accent[0]), tintC(accent[1]), tintC(accent[2])];
  const sideTextColor: RGB = solid ? [255, 255, 255] : [55, 65, 81];
  const sideHeadColor: RGB = solid ? [255, 255, 255] : accent;
  const mainHeadColor: RGB = solid ? [17, 24, 39] : accent;

  const drawSidebarBg = () => {
    doc.setFillColor(sideFill[0], sideFill[1], sideFill[2]);
    doc.rect(0, 0, sidebarW, pageH, "F");
  };
  drawSidebarBg();

  // ----- sidebar (page 1) -----
  let yL = topMargin;
  const sideHeading = (label: string) => {
    yL += 10;
    doc.setFont(bodyFont, "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(sideHeadColor[0], sideHeadColor[1], sideHeadColor[2]);
    doc.text(label.toUpperCase(), sideX, yL);
    yL += 4;
    doc.setDrawColor(sideHeadColor[0], sideHeadColor[1], sideHeadColor[2]);
    doc.setLineWidth(0.5);
    doc.line(sideX, yL, sideX + sideW, yL);
    yL += 9;
  };
  const sideWrite = (str: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
    if (!str) return;
    const size = opts.size ?? 9;
    doc.setFont(bodyFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(sideTextColor[0], sideTextColor[1], sideTextColor[2]);
    for (const ln of doc.splitTextToSize(str, sideW)) {
      doc.text(ln, sideX, yL);
      yL += size * 1.32;
    }
    yL += opts.gap ?? 0;
  };

  const contacts = [profile.email, profile.phone, profile.location, profile.linkedin].filter(Boolean);
  if (contacts.length) {
    sideHeading("Contact");
    contacts.forEach((c) => sideWrite(c, { size: 8.5, gap: 1 }));
  }
  const skills = parseList(profile.skills);
  if (skills.length) {
    sideHeading("Skills");
    skills.forEach((s) => sideWrite("•  " + s, { size: 9, gap: 0.5 }));
  }
  if (profile.education.length) {
    sideHeading("Education");
    profile.education.forEach((ed) => {
      sideWrite(ed.degree || ed.institution, { size: 9, bold: true });
      sideWrite([ed.institution, ed.year].filter(Boolean).join(", "), { size: 8, gap: 3 });
    });
  }
  const certs = profile.certs.split("\n").map((c) => c.trim()).filter(Boolean);
  if (certs.length) {
    sideHeading("Certifications");
    certs.forEach((c) => sideWrite(c, { size: 8.5, gap: 1 }));
  }

  // ----- main column (flows across pages) -----
  let yM = topMargin;
  const ensureMain = (space: number) => {
    if (yM + space > pageH - bottomMargin) {
      doc.addPage();
      drawSidebarBg();
      yM = topMargin;
    }
  };
  const mainWrite = (str: string, opts: { size?: number; bold?: boolean; gap?: number; color?: RGB } = {}) => {
    if (!str) return;
    const size = opts.size ?? 10.5;
    doc.setFont(bodyFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const c = opts.color ?? [30, 30, 30];
    doc.setTextColor(c[0], c[1], c[2]);
    for (const ln of doc.splitTextToSize(str, mainW)) {
      ensureMain(size * 1.4);
      doc.text(ln, mainX, yM);
      yM += size * 1.4;
    }
    yM += opts.gap ?? 0;
  };
  const mainHeading = (label: string) => {
    yM += 12;
    ensureMain(20);
    doc.setFont(bodyFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(mainHeadColor[0], mainHeadColor[1], mainHeadColor[2]);
    doc.text(label.toUpperCase(), mainX, yM);
    yM += 5;
    doc.setDrawColor(mainHeadColor[0], mainHeadColor[1], mainHeadColor[2]);
    doc.setLineWidth(1.2);
    doc.line(mainX, yM, mainRight, yM);
    yM += 10;
  };

  mainWrite(profile.name || "Your Name", { size: 20, bold: true, gap: 1, color: [17, 24, 39] });
  if (profile.title) mainWrite(profile.title, { size: 11, bold: true, gap: 2, color: mainHeadColor });
  if (profile.summary) {
    mainHeading("Professional Summary");
    mainWrite(profile.summary, { gap: 4 });
  }
  if (profile.experience.length) {
    mainHeading("Professional Experience");
    profile.experience.forEach((exp) => {
      mainWrite(`${exp.role}${exp.company ? "  —  " + exp.company : ""}`, { size: 11, bold: true, gap: 0 });
      const dates = [exp.start, exp.end].filter(Boolean).join(" – ");
      if (dates) mainWrite(dates, { size: 9, gap: 2, color: [120, 120, 120] });
      parseBullets(exp.bullets).forEach((b) => mainWrite("•  " + b, { gap: 1.5 }));
      if (exp.tools) mainWrite("Tools: " + exp.tools, { size: 9, gap: 6, color: [90, 90, 90] });
    });
  }

  doc.save(`${slugify(profile.name || "resume")}_${tpl.id}.pdf`);
}
