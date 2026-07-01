// ============== WORD (.doc) EXPORT ==============
// Template-aware Word export. Produces Word-compatible HTML downloaded as .doc
// (opens cleanly in Microsoft Word / Google Docs) — no extra dependency.

import type { Profile, TemplateId, SectionKey } from "./types";
import { getTemplate, DEFAULT_SECTION_ORDER } from "./templates";
import { downloadBlob, slugify } from "./download";

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function exportResumeDOCX(
  profile: Profile,
  templateId: TemplateId,
  accentOverride?: string,
  order?: SectionKey[],
) {
  const tpl = getTemplate(templateId);
  const font = tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const accent = accentOverride || tpl.accent;
  const sectionOrder = order && order.length ? order : DEFAULT_SECTION_ORDER;

  const contact1 = [profile.title, profile.location].filter(Boolean).map(esc).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).map(esc).join("  |  ");

  // Word can't reproduce the fancy layouts reliably, so the .doc export stays a
  // clean single column; only the header treatment follows the template family.
  const banded = tpl.layout === "sidebar";
  const heavyRule = tpl.layout === "headline";

  const heading = (label: string) =>
    `<h2 style="color:${accent};font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:${heavyRule ? 2 : 1}px solid ${accent};padding-bottom:3px;margin:16px 0 6px;">${esc(label)}</h2>`;

  const header = banded
    ? `<div style="background:${accent};color:#fff;padding:18px 22px;margin-bottom:16px;"><div style="font-size:24px;font-weight:bold;">${esc(profile.name || "Your Name")}</div>${contact1 ? `<div style="font-size:11px;">${contact1}</div>` : ""}${contact2 ? `<div style="font-size:11px;">${contact2}</div>` : ""}</div>`
    : `<div style="margin-bottom:6px;"><div style="font-size:24px;font-weight:bold;color:#111;">${esc(profile.name || "Your Name")}</div>${contact1 ? `<div style="font-size:11px;color:#555;">${contact1}</div>` : ""}${contact2 ? `<div style="font-size:11px;color:#555;">${contact2}</div>` : ""}<hr style="border:0;border-top:1px solid ${accent};margin-top:8px;"/></div>`;

  const renderers: Record<SectionKey, () => string> = {
    summary: () => (profile.summary ? heading("Professional Summary") + `<p>${esc(profile.summary)}</p>` : ""),
    skills: () => (profile.skills ? heading("Core Skills") + `<p>${esc(profile.skills)}</p>` : ""),
    experience: () => {
      if (!profile.experience.length) return "";
      let s = heading("Professional Experience");
      profile.experience.forEach((exp) => {
        const dates = [exp.start, exp.end].filter(Boolean).map(esc).join(" &#8211; ");
        const bullets = exp.bullets.split("\n").map((b) => b.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
        s += `<div style="margin-bottom:10px;"><div style="font-weight:bold;">${esc(exp.role)}${exp.company ? ` &#8212; ${esc(exp.company)}` : ""}</div>${dates ? `<div style="font-size:11px;color:#777;font-style:italic;">${dates}</div>` : ""}<ul style="margin:4px 0;padding-left:18px;">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>${exp.tools ? `<div style="font-size:11px;"><b>Tools:</b> ${esc(exp.tools)}</div>` : ""}</div>`;
      });
      return s;
    },
    education: () => {
      if (!profile.education.length) return "";
      let s = heading("Education");
      profile.education.forEach((ed) => {
        s += `<div style="margin-bottom:4px;"><div style="font-weight:bold;">${esc(ed.degree || ed.institution)}</div><div style="font-size:11px;color:#555;">${[ed.institution, ed.year].filter(Boolean).map(esc).join(", ")}</div></div>`;
      });
      return s;
    },
    certs: () =>
      profile.certs
        ? heading("Certifications") + `<ul style="margin:4px 0;padding-left:18px;">${profile.certs.split("\n").filter(Boolean).map((c) => `<li>${esc(c.trim())}</li>`).join("")}</ul>`
        : "",
  };

  const body = sectionOrder.map((key) => renderers[key]()).join("");

  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Resume</title></head><body style="font-family:${font};font-size:13px;line-height:1.5;color:#1a1a1a;">${header}${body}</body></html>`;

  downloadBlob(
    `${slugify(profile.name || "resume")}_${tpl.id}.doc`,
    new Blob(["\ufeff" + html], { type: "application/msword" }),
  );
}
