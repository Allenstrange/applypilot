"use client";

import type React from "react";
import type { Profile, TemplateId, SectionKey } from "@/lib/types";
import { getTemplate, DEFAULT_SECTION_ORDER } from "@/lib/templates";

interface Props {
  profile: Profile;
  templateId: TemplateId;
  accent?: string;
  order?: SectionKey[];
  editable?: boolean;
  onPatch?: (patch: Partial<Profile>) => void;
}

function readText(e: React.FocusEvent<HTMLElement>): string {
  return e.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
}

export default function ResumePreview({
  profile,
  templateId,
  accent: accentOverride,
  order,
  editable = false,
  onPatch,
}: Props) {
  const tpl = getTemplate(templateId);
  const accent = accentOverride || tpl.accent;
  const fontFamily =
    tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const compact = tpl.id === "compact";
  const plain = tpl.header === "plain";
  const sectionOrder = order && order.length ? order : DEFAULT_SECTION_ORDER;

  const patch = (p: Partial<Profile>) => onPatch?.(p);
  const updateExp = (i: number, p: Partial<Profile["experience"][number]>) =>
    patch({ experience: profile.experience.map((e, idx) => (idx === i ? { ...e, ...p } : e)) });
  const updateBulletLine = (i: number, j: number, text: string) => {
    const lines = profile.experience[i].bullets.split("\n");
    lines[j] = text;
    updateExp(i, { bullets: lines.join("\n") });
  };
  const updateEdu = (i: number, p: Partial<Profile["education"][number]>) =>
    patch({ education: profile.education.map((e, idx) => (idx === i ? { ...e, ...p } : e)) });

  const baseCls =
    "rounded-sm cursor-text transition-colors hover:bg-amber-100/70 focus:bg-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400";
  const inlineCls = `${baseCls} px-0.5 -mx-0.5 underline decoration-dotted decoration-slate-300/70 underline-offset-2 hover:decoration-amber-400`;
  const blockCls = `${baseCls} block border-l-2 border-dashed border-slate-200 pl-2 hover:border-amber-400`;

  function field(
    value: string,
    onCommit: (v: string) => void,
    opts: { placeholder?: string; style?: React.CSSProperties; block?: boolean } = {},
  ) {
    if (!editable) return <span style={opts.style}>{value || opts.placeholder || ""}</span>;
    const common = {
      contentEditable: true,
      suppressContentEditableWarning: true,
      title: "Click to edit",
      className: opts.block ? blockCls : inlineCls,
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        const v = readText(e);
        if (v !== value) onCommit(v);
      },
    };
    if (opts.block) {
      return (
        <div {...common} style={{ ...opts.style, whiteSpace: "pre-wrap", minHeight: "1em" }}>
          {value}
        </div>
      );
    }
    return (
      <span {...common} style={{ ...opts.style, display: "inline-block", minWidth: 6 }}>
        {value}
      </span>
    );
  }

  const heading = (label: string) => (
    <h2
      style={{
        color: accent,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: compact ? 12 : 16,
        marginBottom: 6,
        borderBottom: `${plain ? 1 : 2}px solid ${accent}`,
        paddingBottom: 3,
      }}
    >
      {label}
    </h2>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary:
      profile.summary || editable ? (
        <div>
          {heading("Professional Summary")}
          {field(profile.summary, (v) => patch({ summary: v }), {
            block: true,
            placeholder: "Add a professional summary…",
            style: { margin: 0 },
          })}
        </div>
      ) : null,

    skills:
      profile.skills || editable ? (
        <div>
          {heading("Core Skills")}
          {field(profile.skills, (v) => patch({ skills: v }), {
            block: true,
            placeholder: "Comma-separated skills…",
            style: { margin: 0 },
          })}
        </div>
      ) : null,

    experience:
      profile.experience.length || editable ? (
        <div>
          {heading("Professional Experience")}
          {profile.experience.map((exp, i) => {
            const lines = editable
              ? exp.bullets.split("\n")
              : exp.bullets
                  .split("\n")
                  .map((b) => b.replace(/^[-•]\s*/, "").trim())
                  .filter(Boolean);
            return (
              <div key={i} style={{ marginBottom: compact ? 8 : 12 }}>
                <div style={{ fontWeight: 700 }}>
                  {field(exp.role, (v) => updateExp(i, { role: v }), { placeholder: "Role" })}
                  {exp.company || editable ? (
                    <>
                      {" — "}
                      {field(exp.company, (v) => updateExp(i, { company: v }), { placeholder: "Company" })}
                    </>
                  ) : null}
                </div>
                {[exp.start, exp.end].filter(Boolean).length || editable ? (
                  <div style={{ fontSize: 11, color: "#777", fontStyle: "italic" }}>
                    {field(exp.start, (v) => updateExp(i, { start: v }), { placeholder: "Start" })}
                    {" – "}
                    {field(exp.end, (v) => updateExp(i, { end: v }), { placeholder: "End" })}
                  </div>
                ) : null}
                <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
                  {lines.map((b, j) => (
                    <li key={j} style={{ marginBottom: 2 }}>
                      {field(b.replace(/^[-•]\s*/, ""), (v) => updateBulletLine(i, j, v), {
                        placeholder: "Achievement…",
                      })}
                    </li>
                  ))}
                </ul>
                {exp.tools || editable ? (
                  <div style={{ fontSize: 11 }}>
                    <strong>Tools:</strong>{" "}
                    {field(exp.tools, (v) => updateExp(i, { tools: v }), { placeholder: "Tools" })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null,

    education: profile.education.length ? (
      <div>
        {heading("Education")}
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700 }}>
              {field(ed.degree || ed.institution, (v) => updateEdu(i, { degree: v }), { placeholder: "Degree" })}
            </div>
            <div style={{ fontSize: 11, color: "#555" }}>
              {field(ed.institution, (v) => updateEdu(i, { institution: v }), { placeholder: "Institution" })}
              {ed.year || editable ? <>{", "}{field(ed.year, (v) => updateEdu(i, { year: v }), { placeholder: "Year" })}</> : null}
            </div>
          </div>
        ))}
      </div>
    ) : null,

    certs: profile.certs ? (
      <div>
        {heading("Certifications")}
        <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
          {profile.certs
            .split("\n")
            .filter(Boolean)
            .map((c, i) => (
              <li key={i}>{c.trim()}</li>
            ))}
        </ul>
      </div>
    ) : null,
  };

  const contact1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("  |  ");

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm text-[#1a1a1a]"
      style={{ fontFamily, padding: compact ? 28 : 36, lineHeight: 1.5, fontSize: 13 }}
    >
      {/* Header */}
      {tpl.header === "band" ? (
        <div style={{ background: accent, color: "#fff", margin: compact ? -28 : -36, marginBottom: 20, padding: compact ? "20px 28px" : "24px 36px" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {field(profile.name, (v) => patch({ name: v }), { placeholder: "Your Name" })}
          </div>
          {contact1 || editable ? <div style={{ fontSize: 11, opacity: 0.95, marginTop: 2 }}>{contact1 || (editable ? "Title  |  Location" : "")}</div> : null}
          {contact2 || editable ? <div style={{ fontSize: 11, opacity: 0.95 }}>{contact2 || (editable ? "Email  |  Phone  |  LinkedIn" : "")}</div> : null}
        </div>
      ) : (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>
            {field(profile.name, (v) => patch({ name: v }), { placeholder: "Your Name" })}
          </div>
          {contact1 ? <div style={{ fontSize: 11, color: "#555" }}>{contact1}</div> : null}
          {contact2 ? <div style={{ fontSize: 11, color: "#555" }}>{contact2}</div> : null}
          {tpl.header === "rule" ? <hr style={{ border: 0, borderTop: `1px solid ${accent}`, marginTop: 8 }} /> : null}
        </div>
      )}

      {sectionOrder.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
    </div>
  );
}
