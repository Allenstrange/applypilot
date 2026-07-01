// ============== TEMPLATE-AWARE RESUME PDF (jsPDF) ==============
// Mirrors the six layout engines in components/ResumePreview.tsx so the
// downloaded PDF matches the on-screen preview: classicClear, sidebar
// (Atlantic Blue), banded (Mercury Flow), labelLeft (Ledger), headline, slate.

import { jsPDF } from "jspdf";
import type { Profile, TemplateId, SectionKey } from "./types";
import {
  resolveTemplate,
  DEFAULT_SECTION_ORDER,
  type ResolvedTemplate,
  type StyleOverrides,
} from "./templates";
import { parseBullets, parseLines, parseList } from "./resumeFormat";
import { slugify } from "./download";

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function pdfFont(font: "serif" | "sans" | "mono"): string {
  if (font === "serif") return "times";
  if (font === "mono") return "courier";
  return "helvetica";
}

const PDF_DENSITY = {
  compact: { margin: 44, lh: 1.26, headTop: 6, secGap: 4, bulletGap: 1 },
  normal: { margin: 54, lh: 1.38, headTop: 10, secGap: 6, bulletGap: 1.5 },
  relaxed: { margin: 64, lh: 1.52, headTop: 15, secGap: 10, bulletGap: 3 },
};

const INK: RGB = [26, 26, 26];
const MUTED: RGB = [95, 104, 114];

interface Ctx {
  doc: jsPDF;
  tpl: ResolvedTemplate;
  accent: RGB;
  bodyFont: string;
  dz: (typeof PDF_DENSITY)["normal"];
  pageW: number;
  pageH: number;
  margin: number;
  y: number;
  /** Called after every automatic page break (repaint sidebars etc.). */
  onNewPage?: () => void;
}

function makeCtx(tpl: ResolvedTemplate): Ctx {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const dz = PDF_DENSITY[tpl.density];
  return {
    doc,
    tpl,
    accent: hexToRgb(tpl.accent),
    bodyFont: pdfFont(tpl.font),
    dz,
    pageW: doc.internal.pageSize.getWidth(),
    pageH: doc.internal.pageSize.getHeight(),
    margin: dz.margin,
    y: dz.margin,
  };
}

function ensure(c: Ctx, space: number) {
  if (c.y + space > c.pageH - c.margin) {
    c.doc.addPage();
    c.y = c.margin;
    c.onNewPage?.();
  }
}

interface WriteOpts {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  gap?: number;
  color?: RGB;
  x?: number;
  maxW?: number;
  align?: "left" | "center";
}

function setFont(c: Ctx, o: WriteOpts) {
  const style = o.bold && o.italic ? "bolditalic" : o.bold ? "bold" : o.italic ? "italic" : "normal";
  c.doc.setFont(c.bodyFont, style);
  c.doc.setFontSize(o.size ?? 10.5);
  const col = o.color ?? INK;
  c.doc.setTextColor(col[0], col[1], col[2]);
}

/** Write wrapped text at x (default left margin); advances y. */
function write(c: Ctx, str: string, o: WriteOpts = {}) {
  if (!str) return;
  const size = o.size ?? 10.5;
  setFont(c, o);
  const x = o.x ?? c.margin;
  const maxW = o.maxW ?? c.pageW - c.margin - x;
  const line = size * c.dz.lh;
  for (const ln of c.doc.splitTextToSize(str, maxW)) {
    ensure(c, line);
    if (o.align === "center") c.doc.text(ln, x + maxW / 2, c.y, { align: "center" });
    else c.doc.text(ln, x, c.y);
    c.y += line;
  }
  c.y += o.gap ?? 0;
}

/** One line with left text and right-aligned text on the same baseline. */
function splitRow(
  c: Ctx,
  left: string,
  right: string,
  o: { size?: number; bold?: boolean; rightBold?: boolean; rightColor?: RGB; x?: number; rightX?: number } = {},
) {
  const size = o.size ?? 11;
  const line = size * c.dz.lh;
  ensure(c, line);
  const x = o.x ?? c.margin;
  const rx = o.rightX ?? c.pageW - c.margin;
  setFont(c, { size, bold: o.bold });
  if (left) c.doc.text(c.doc.splitTextToSize(left, rx - x - 90)[0] ?? left, x, c.y);
  if (right) {
    setFont(c, { size: size - 1, bold: o.rightBold, color: o.rightColor ?? MUTED });
    c.doc.text(right, rx, c.y, { align: "right" });
  }
  c.y += line;
}

/** Bulleted list within [x, x+maxW]. */
function bullets(c: Ctx, items: string[], o: { size?: number; x?: number; maxW?: number; gap?: number } = {}) {
  const size = o.size ?? 10.5;
  const x = o.x ?? c.margin;
  const maxW = o.maxW ?? c.pageW - c.margin - x;
  for (const b of items) {
    setFont(c, { size });
    const line = size * c.dz.lh;
    const wrapped = c.doc.splitTextToSize(b, maxW - 12);
    for (let i = 0; i < wrapped.length; i++) {
      ensure(c, line);
      if (i === 0) c.doc.text("•", x, c.y);
      c.doc.text(wrapped[i], x + 12, c.y);
      c.y += line;
    }
    c.y += o.gap ?? c.dz.bulletGap;
  }
}

/** Multi-column bullet list (for skills). */
function columnBullets(c: Ctx, items: string[], cols: number, o: { size?: number; x?: number; totalW?: number } = {}) {
  if (!items.length) return;
  const size = o.size ?? 10.5;
  const x0 = o.x ?? c.margin;
  const totalW = o.totalW ?? c.pageW - c.margin - x0;
  const colW = (totalW - (cols - 1) * 16) / cols;
  const per = Math.ceil(items.length / cols);
  const line = size * c.dz.lh;
  // pre-measure tallest column (items may wrap)
  let maxRows = 0;
  setFont(c, { size });
  const colItems: string[][] = [];
  for (let ci = 0; ci < cols; ci++) {
    const slice = items.slice(ci * per, (ci + 1) * per);
    colItems.push(slice);
    const rows = slice.reduce((n, s) => n + c.doc.splitTextToSize(s, colW - 12).length, 0);
    maxRows = Math.max(maxRows, rows + slice.length * 0.15);
  }
  ensure(c, Math.min(maxRows * line + 4, c.pageH - c.margin * 2));
  const yStart = c.y;
  let yMax = yStart;
  for (let ci = 0; ci < cols; ci++) {
    let yy = yStart;
    const x = x0 + ci * (colW + 16);
    for (const s of colItems[ci]) {
      for (const [i, ln] of c.doc.splitTextToSize(s, colW - 12).entries()) {
        if (i === 0) c.doc.text("•", x, yy);
        c.doc.text(ln as string, x + 12, yy);
        yy += line;
      }
      yy += 1.5;
    }
    yMax = Math.max(yMax, yy);
  }
  c.y = yMax + 2;
}

const dates = (s: string, e: string) => [s, e].filter(Boolean).join(" – ");

// ---------------------------------------------------------------- layouts

function classicClearPDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  write(c, p.name || "Your Name", { size: 22, bold: true, align: "center", x: c.margin, gap: 0 });
  if (p.title) write(c, p.title, { size: 11.5, italic: true, align: "center", x: c.margin, gap: 1 });
  const contact = [p.location, p.email, p.phone, p.linkedin].filter(Boolean).join("   •   ");
  if (contact) write(c, contact, { size: 9, align: "center", x: c.margin, gap: 4, color: [51, 51, 51] });

  const heading = (label: string) => {
    c.y += c.dz.headTop;
    ensure(c, 22);
    setFont(c, { size: 11, bold: true, color: c.accent });
    c.doc.text(tpl.headingUppercase ? label.toUpperCase() : label, c.margin, c.y);
    c.y += 5;
    if (tpl.headingUnderline) {
      c.doc.setDrawColor(c.accent[0], c.accent[1], c.accent[2]);
      c.doc.setLineWidth(0.8);
      c.doc.line(c.margin, c.y, c.pageW - c.margin, c.y);
    }
    c.y += 11;
  };

  const sections: Record<SectionKey, () => void> = {
    summary: () => {
      if (!p.summary) return;
      heading("Summary");
      write(c, p.summary, { gap: 2 });
    },
    skills: () => {
      if (!p.skills) return;
      heading("Skills");
      columnBullets(c, parseList(p.skills), 2);
    },
    experience: () => {
      if (!p.experience.length) return;
      heading("Professional Experience");
      p.experience.forEach((exp) => {
        splitRow(c, exp.role, dates(exp.start, exp.end), { size: 11, bold: true, rightColor: INK });
        if (exp.company) write(c, exp.company, { size: 10, italic: true, gap: 1 });
        bullets(c, parseBullets(exp.bullets));
        if (exp.tools) write(c, "Tools: " + exp.tools, { size: 9, color: MUTED });
        c.y += c.dz.secGap;
      });
    },
    education: () => {
      if (!p.education.length) return;
      heading("Education");
      p.education.forEach((ed) => {
        splitRow(c, ed.degree || ed.institution, ed.year, { size: 10.5, bold: true, rightColor: INK });
        if (ed.degree && ed.institution) write(c, ed.institution, { size: 10, italic: true, gap: 3 });
      });
    },
    certs: () => {
      if (!p.certs) return;
      heading("Certificates");
      columnBullets(c, parseLines(p.certs), 2);
    },
  };
  order.forEach((k) => sections[k]());
}

function slatePDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  write(c, p.name || "Your Name", { size: 19, bold: true, align: "center", x: c.margin, gap: 1, color: c.accent });
  const contact = [p.location, p.email, p.phone, p.linkedin].filter(Boolean).join("   •   ");
  if (contact) write(c, contact, { size: 9, align: "center", x: c.margin, gap: 5, color: MUTED });

  const heading = (label: string) => {
    c.y += c.dz.headTop;
    ensure(c, 22);
    setFont(c, { size: 10.5, bold: true, color: c.accent });
    c.doc.text(tpl.headingUppercase ? label.toUpperCase() : label, c.margin, c.y);
    c.y += 6;
    if (tpl.headingUnderline) {
      c.doc.setDrawColor(215, 220, 225);
      c.doc.setLineWidth(0.7);
      c.doc.line(c.margin, c.y, c.pageW - c.margin, c.y);
    }
    c.y += 11;
  };

  const sections: Record<SectionKey, () => void> = {
    summary: () => {
      if (!p.summary) return;
      heading("Professional Summary");
      write(c, p.summary, { gap: 2 });
    },
    skills: () => {
      if (!p.skills) return;
      heading("Skills");
      write(c, p.skills, { gap: 2 });
    },
    experience: () => {
      if (!p.experience.length) return;
      heading("Professional Experience");
      p.experience.forEach((exp) => {
        splitRow(c, exp.role, dates(exp.start, exp.end), { size: 11, bold: true });
        if (exp.company) write(c, exp.company, { size: 10, color: [60, 70, 82], gap: 1 });
        bullets(c, parseBullets(exp.bullets), { size: 10 });
        if (exp.tools) write(c, "Tools: " + exp.tools, { size: 9, color: MUTED });
        c.y += c.dz.secGap;
      });
    },
    education: () => {
      if (!p.education.length) return;
      heading("Education");
      p.education.forEach((ed) => {
        splitRow(c, ed.degree || ed.institution, ed.year, { size: 10.5, bold: true });
        if (ed.degree && ed.institution) write(c, ed.institution, { size: 10, color: [60, 70, 82], gap: 3 });
      });
    },
    certs: () => {
      if (!p.certs) return;
      heading("Certifications");
      bullets(c, parseLines(p.certs), { size: 10 });
    },
  };
  order.forEach((k) => sections[k]());
}

function headlinePDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  write(c, (p.name || "Your Name").toUpperCase(), { size: 27, bold: true, align: "center", x: c.margin, gap: 2, color: c.accent });
  if (p.title) write(c, p.title, { size: 11.5, bold: true, align: "center", x: c.margin, gap: 1 });
  const contact = [p.location, p.email, p.phone, p.linkedin].filter(Boolean).join(" | ");
  if (contact) write(c, contact, { size: 10, align: "center", x: c.margin, gap: 4 });

  const heading = (label: string) => {
    c.y += c.dz.headTop + 2;
    ensure(c, 24);
    setFont(c, { size: 13, bold: true, color: c.accent });
    c.doc.text(tpl.headingUppercase ? label.toUpperCase() : label, c.margin, c.y);
    c.y += 6;
    if (tpl.headingUnderline) {
      c.doc.setDrawColor(c.accent[0], c.accent[1], c.accent[2]);
      c.doc.setLineWidth(1.6);
      c.doc.line(c.margin, c.y, c.pageW - c.margin, c.y);
    }
    c.y += 13;
  };

  const sections: Record<SectionKey, () => void> = {
    summary: () => {
      if (!p.summary) return;
      heading("Professional Summary");
      write(c, p.summary, { size: 10.5, gap: 2 });
    },
    skills: () => {
      if (!p.skills) return;
      heading("Skills");
      bullets(c, parseList(p.skills), { gap: 2 });
    },
    experience: () => {
      if (!p.experience.length) return;
      heading("Work Experience");
      p.experience.forEach((exp) => {
        write(c, exp.role, { size: 11.5, bold: true, gap: 0 });
        splitRow(c, exp.company, dates(exp.start, exp.end), { size: 10.5, bold: true, rightBold: true, rightColor: INK });
        c.y += 2;
        bullets(c, parseBullets(exp.bullets), { gap: c.dz.bulletGap + 0.5 });
        if (exp.tools) write(c, "Tools: " + exp.tools, { size: 9.5 });
        c.y += c.dz.secGap;
      });
    },
    education: () => {
      if (!p.education.length) return;
      heading("Education");
      p.education.forEach((ed) => {
        write(c, ed.degree || ed.institution, { size: 11, bold: true, gap: 0 });
        splitRow(c, ed.degree ? ed.institution : "", ed.year ? `Graduated: ${ed.year}` : "", {
          size: 10.5,
          bold: true,
          rightBold: true,
          rightColor: INK,
        });
        c.y += 3;
      });
    },
    certs: () => {
      if (!p.certs) return;
      heading("Certifications");
      bullets(c, parseLines(p.certs), { gap: 2 });
    },
  };
  order.forEach((k) => sections[k]());
}

const SIDEBAR_W = 190;

function sidebarPDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  const pad = 20;
  const sideMaxW = SIDEBAR_W - pad * 2;
  const mainX = SIDEBAR_W + 26;

  const paintSidebarBg = () => {
    c.doc.setFillColor(c.accent[0], c.accent[1], c.accent[2]);
    c.doc.rect(0, 0, SIDEBAR_W, c.pageH, "F");
  };
  paintSidebarBg();
  c.onNewPage = paintSidebarBg;

  // ---- sidebar content (single page budget; wraps but doesn't paginate) ----
  let sy = 42;
  const sWrite = (str: string, o: { size?: number; bold?: boolean; gap?: number; alpha?: number } = {}) => {
    if (!str) return;
    const size = o.size ?? 9;
    c.doc.setFont(c.bodyFont, o.bold ? "bold" : "normal");
    c.doc.setFontSize(size);
    c.doc.setTextColor(255, 255, 255);
    for (const ln of c.doc.splitTextToSize(str, sideMaxW)) {
      if (sy > c.pageH - 30) return; // sidebar overflow: stop quietly
      c.doc.text(ln, pad, sy);
      sy += size * 1.45;
    }
    sy += o.gap ?? 0;
  };
  const sHeading = (label: string) => {
    sy += 14;
    c.doc.setFont(c.bodyFont, "bold");
    c.doc.setFontSize(8.5);
    c.doc.setTextColor(255, 255, 255);
    c.doc.text(label.toUpperCase(), pad, sy);
    sy += 4;
    c.doc.setDrawColor(255, 255, 255);
    c.doc.setLineWidth(0.5);
    c.doc.line(pad, sy, SIDEBAR_W - pad, sy);
    sy += 12;
  };

  sWrite(p.name || "Your Name", { size: 17, bold: true, gap: 2 });
  sWrite(p.title, { size: 10, gap: 10 });
  [p.email, p.phone, p.location, p.linkedin].filter(Boolean).forEach((line) => sWrite(line, { size: 8.5, gap: 2 }));
  if (p.summary) {
    sHeading("Profile");
    sWrite(p.summary, { size: 8.5 });
  }
  if (p.certs) {
    sHeading("Certifications");
    parseLines(p.certs).forEach((cert) => sWrite(cert, { size: 8.5, gap: 2 }));
  }

  // ---- main column ----
  c.y = 42;
  const mainW = c.pageW - mainX - c.margin;
  const banner = (label: string) => {
    c.y += c.dz.headTop;
    ensure(c, 26);
    c.doc.setFillColor(238, 241, 244);
    c.doc.rect(mainX, c.y - 11, mainW, 17, "F");
    setFont(c, { size: 10, bold: true, color: [38, 49, 60] });
    c.doc.text(tpl.headingUppercase ? label.toUpperCase() : label, mainX + 7, c.y + 1);
    c.y += 17;
  };

  const mainSections: Partial<Record<SectionKey, () => void>> = {
    experience: () => {
      if (!p.experience.length) return;
      banner("Work Experience");
      p.experience.forEach((exp) => {
        write(c, exp.company || exp.role, { size: 11, bold: true, x: mainX, maxW: mainW, gap: 0 });
        if (exp.company) write(c, exp.role, { size: 10, x: mainX, maxW: mainW, gap: 0 });
        write(c, dates(exp.start, exp.end), { size: 8.5, color: MUTED, x: mainX, maxW: mainW, gap: 2 });
        bullets(c, parseBullets(exp.bullets), { size: 9.5, x: mainX, maxW: mainW });
        if (exp.tools) write(c, "Tools: " + exp.tools, { size: 8.5, color: MUTED, x: mainX, maxW: mainW });
        c.y += c.dz.secGap;
      });
    },
    education: () => {
      if (!p.education.length) return;
      banner("Education");
      p.education.forEach((ed) => {
        write(c, ed.degree || ed.institution, { size: 10.5, bold: true, x: mainX, maxW: mainW, gap: 0 });
        write(c, [ed.degree ? ed.institution : "", ed.year].filter(Boolean).join("  |  "), {
          size: 9,
          color: MUTED,
          x: mainX,
          maxW: mainW,
          gap: 3,
        });
      });
    },
    skills: () => {
      if (!p.skills) return;
      banner("Skills");
      bullets(c, parseList(p.skills), { size: 9.5, x: mainX, maxW: mainW, gap: 1.5 });
    },
  };
  order.filter((k) => k in mainSections).forEach((k) => mainSections[k]?.());
  c.onNewPage = undefined;
}

function bandedPDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  write(c, p.name || "Your Name", { size: 19, bold: true, gap: 0, color: [28, 36, 44] });
  if (p.title) write(c, p.title, { size: 10.5, color: [60, 70, 82], gap: 1 });
  const contact = [p.email, p.phone, p.linkedin, p.location].filter(Boolean).join("   ·   ");
  if (contact) write(c, contact, { size: 8.5, color: MUTED, gap: 3 });

  const fullW = c.pageW - c.margin * 2;
  const banner = (label: string) => {
    c.y += c.dz.headTop;
    ensure(c, 26);
    c.doc.setFillColor(241, 243, 245);
    c.doc.rect(c.margin, c.y - 11, fullW, 17, "F");
    setFont(c, { size: 10, bold: true, color: c.accent });
    c.doc.text(tpl.headingUppercase ? label.toUpperCase() : label, c.pageW / 2, c.y + 1, { align: "center" });
    c.y += 18;
  };

  const RAIL = 92;
  const bodyX = c.margin + RAIL + 14;
  const bodyW = c.pageW - c.margin - bodyX;

  const railRow = (rail: string, renderBody: () => void) => {
    const yStart = c.y;
    setFont(c, { size: 8.5, color: [85, 95, 106] });
    for (const ln of c.doc.splitTextToSize(rail, RAIL)) {
      c.doc.text(ln, c.margin, c.y);
      c.y += 8.5 * c.dz.lh;
    }
    const railEnd = c.y;
    c.y = yStart;
    renderBody();
    c.y = Math.max(c.y, railEnd) + c.dz.secGap;
  };

  const sections: Record<SectionKey, () => void> = {
    summary: () => {
      if (!p.summary) return;
      banner("Summary");
      write(c, p.summary, { size: 10, gap: 2 });
    },
    skills: () => {
      if (!p.skills) return;
      banner("Skills");
      columnBullets(c, parseList(p.skills), 3, { size: 9.5 });
    },
    experience: () => {
      if (!p.experience.length) return;
      banner("Professional Experience");
      p.experience.forEach((exp) => {
        ensure(c, 60);
        railRow(dates(exp.start, exp.end), () => {
          write(c, exp.company || exp.role, { size: 11, bold: true, x: bodyX, maxW: bodyW, gap: 0 });
          if (exp.company) write(c, exp.role, { size: 10, x: bodyX, maxW: bodyW, gap: 1 });
          bullets(c, parseBullets(exp.bullets), { size: 9.5, x: bodyX, maxW: bodyW });
          if (exp.tools) write(c, "Tools: " + exp.tools, { size: 8.5, color: MUTED, x: bodyX, maxW: bodyW });
        });
      });
    },
    education: () => {
      if (!p.education.length) return;
      banner("Education");
      p.education.forEach((ed) => {
        ensure(c, 34);
        railRow(ed.year, () => {
          write(c, ed.degree || ed.institution, { size: 10.5, bold: true, x: bodyX, maxW: bodyW, gap: 0 });
          if (ed.degree && ed.institution) write(c, ed.institution, { size: 9.5, color: [60, 70, 82], x: bodyX, maxW: bodyW });
        });
      });
    },
    certs: () => {
      if (!p.certs) return;
      banner("Certifications");
      bullets(c, parseLines(p.certs), { size: 10 });
    },
  };
  order.forEach((k) => sections[k]());
}

function labelLeftPDF(c: Ctx, p: Profile, order: SectionKey[]) {
  const { tpl } = c;
  const header = [p.name || "Your Name", p.title].filter(Boolean).join(", ");
  write(c, header, { size: 16, bold: true, align: "center", x: c.margin, gap: 1, color: [35, 32, 25] });
  const contact = [p.location, p.phone, p.email, p.linkedin].filter(Boolean).join("  ·  ");
  if (contact) write(c, contact, { size: 8.5, align: "center", x: c.margin, gap: 4, color: [108, 103, 95] });

  const LABEL_W = 92;
  const bodyX = c.margin + LABEL_W + 16;
  const bodyW = c.pageW - c.margin - bodyX;
  const LABELS: Record<SectionKey, string> = {
    summary: "Profile",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    certs: "Certificates",
  };

  const section = (key: SectionKey, renderBody: () => void) => {
    c.y += c.dz.headTop;
    ensure(c, 40);
    if (tpl.headingUnderline) {
      c.doc.setDrawColor(228, 224, 218);
      c.doc.setLineWidth(0.7);
      c.doc.line(c.margin, c.y - 6, c.pageW - c.margin, c.y - 6);
    }
    c.y += 8;
    setFont(c, { size: 8.5, bold: true, color: c.accent });
    c.doc.text(tpl.headingUppercase ? LABELS[key].toUpperCase() : LABELS[key], c.margin, c.y);
    renderBody();
    c.y += 2;
  };

  const sections: Record<SectionKey, () => void> = {
    summary: () => {
      if (!p.summary) return;
      section("summary", () => write(c, p.summary, { size: 10, x: bodyX, maxW: bodyW }));
    },
    skills: () => {
      if (!p.skills) return;
      section("skills", () => columnBullets(c, parseList(p.skills), 2, { size: 9.5, x: bodyX, totalW: bodyW }));
    },
    experience: () => {
      if (!p.experience.length) return;
      section("experience", () => {
        p.experience.forEach((exp) => {
          write(c, [exp.role, exp.company].filter(Boolean).join(", "), { size: 10.5, bold: true, x: bodyX, maxW: bodyW, gap: 0 });
          write(c, dates(exp.start, exp.end), { size: 8.5, italic: true, color: [108, 103, 95], x: bodyX, maxW: bodyW, gap: 1 });
          bullets(c, parseBullets(exp.bullets), { size: 9.5, x: bodyX, maxW: bodyW });
          if (exp.tools) write(c, "Tools: " + exp.tools, { size: 8.5, color: [108, 103, 95], x: bodyX, maxW: bodyW });
          c.y += c.dz.secGap;
        });
      });
    },
    education: () => {
      if (!p.education.length) return;
      section("education", () => {
        p.education.forEach((ed) => {
          write(c, ed.degree || ed.institution, { size: 10, bold: true, x: bodyX, maxW: bodyW, gap: 0 });
          write(c, [ed.degree ? ed.institution : "", ed.year].filter(Boolean).join(", "), {
            size: 8.5,
            italic: true,
            color: [108, 103, 95],
            x: bodyX,
            maxW: bodyW,
            gap: 3,
          });
        });
      });
    },
    certs: () => {
      if (!p.certs) return;
      section("certs", () => bullets(c, parseLines(p.certs), { size: 9.5, x: bodyX, maxW: bodyW, gap: 2 }));
    },
  };
  order.forEach((k) => sections[k]());
}

// ---------------------------------------------------------------- entry point

export function exportResumePDF(
  profile: Profile,
  templateId: TemplateId,
  opts?: StyleOverrides,
  sectionOrder?: SectionKey[],
) {
  const tpl = resolveTemplate(templateId, opts);
  const order = sectionOrder?.length ? sectionOrder : DEFAULT_SECTION_ORDER;
  const c = makeCtx(tpl);

  switch (tpl.layout) {
    case "sidebar":
      sidebarPDF(c, profile, order);
      break;
    case "banded":
      bandedPDF(c, profile, order);
      break;
    case "labelLeft":
      labelLeftPDF(c, profile, order);
      break;
    case "headline":
      headlinePDF(c, profile, order);
      break;
    case "slate":
      slatePDF(c, profile, order);
      break;
    default:
      classicClearPDF(c, profile, order);
  }

  c.doc.save(`${slugify(profile.name || "resume")}_${tpl.id}.pdf`);
}
