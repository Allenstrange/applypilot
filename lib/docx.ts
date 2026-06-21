// ============== WORD (.doc) EXPORT ==============
// Template-aware Word export. Produces Word-compatible HTML downloaded as .doc
// (opens cleanly in Microsoft Word / Google Docs) — no extra dependency.

import type { Profile, TemplateId } from "./types";
import { getTemplate } from "./templates";
import { downloadBlob, slugify } from "./download";

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function exportResumeDOCX(profile: Profile, templateId: TemplateId) {
  const tpl = getTemplate(templateId);
  const font = tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const accent = tpl.accent;

  const contact1 = [profile.title, profile.location].filter(Boolean).map(esc).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).map(esc).join("  |  ");

  const heading = (label: string) =>
    `<h2 style="color:${accent};font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:${tpl.header === "plain" ? 1 : 2}px solid ${accent};padding-bottom:3px;margin:16px 0 6px;">${esc(label)}</h2>`;

  const header =
    tpl.header === "band"
      ? `<div style="background:${accent};color:#fff;padding:18px 22px;margin-bottom:16px;"><div style="font-size:24px;font-weight:bold;">${esc(profile.name || "Your Name")}</div>${contact1 ? `<div style="font-size:11px;">${contact1}</div>` : ""}${contact2 ? `<div style="font-size:11px;">${contact2}</div>` : ""}</div>`
      : `<div style="margin-bottom:6px;"><div style="font-size:24px;font-weight:bold;color:#111;">${esc(profile.name || "Your Name")}</div>${contact1 ? `<div style="font-size:11px;color:#555;">${contact1}</div>` : ""}${contact2 ? `<div style="font-size:11px;color:#555;">${contact2}</div>` : ""}${tpl.header === "rule" ? `<hr style="border:0;border-top:1px solid #111;margin-top:8px;"/>` : ""}</div>`;

  let body = "";
  if (profile.summary) body += heading("Professional Summary") + `<p>${esc(profile.summary)}</p>`;
  if (profile.skills) body += heading("Core Skills") + `<p>${esc(profile.skills)}</p>`;
  if (profile.experience.length) {
    body += heading("Professional Experience");
    profile.experience.forEach((exp) => {
      const dates = [exp.start, exp.end].filter(Boolean).map(esc).join(" &#8211; ");
      const bullets = exp.bullets.split("\n").map((b) => b.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
      body += `<div style="margin-bottom:10px;"><div style="font-weight:bold;">${esc(exp.role)}${exp.company ? ` &#8212; ${esc(exp.company)}` : ""}</div>${dates ? `<div style="font-size:11px;color:#777;font-style:italic;">${dates}</div>` : ""}<ul style="margin:4px 0;padding-left:18px;">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>${exp.tools ? `<div style="font-size:11px;"><b>Tools:</b> ${esc(exp.tools)}</div>` : ""}</div>`;
    });
  }
  if (profile.education.length) {
    body += heading("Education");
    profile.education.forEach((ed) => {
      body += `<div style="margin-bottom:4px;"><div style="font-weight:bold;">${esc(ed.degree || ed.institution)}</div><div style="font-size:11px;color:#555;">${[ed.institution, ed.year].filter(Boolean).map(esc).join(", ")}</div></div>`;
    });
  }
  if (profile.certs) {
    body += heading("Certifications") + `<ul style="margin:4px 0;padding-left:18px;">${profile.certs.split("\n").filter(Boolean).map((c) => `<li>${esc(c.trim())}</li>`).join("")}</ul>`;
  }

  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Resume</title></head><body style="font-family:${font};font-size:13px;line-height:1.5;color:#1a1a1a;">${header}${body}</body></html>`;

  downloadBlob(
    `${slugify(profile.name || "resume")}_${tpl.id}.doc`,
    new Blob(["\ufeff" + html], { type: "application/msword" }),
  );
}
