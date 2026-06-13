import type { Profile, TemplateId } from "@/lib/types";
import { getTemplate } from "@/lib/templates";

function PreviewHeading({
  accent,
  plain,
  compact,
  children,
}: {
  accent: string;
  plain: boolean;
  compact: boolean;
  children: string;
}) {
  return (
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
      {children}
    </h2>
  );
}

export default function ResumePreview({
  profile,
  templateId,
}: {
  profile: Profile;
  templateId: TemplateId;
}) {
  const tpl = getTemplate(templateId);
  const fontFamily = tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const compact = tpl.id === "compact";

  const contact1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("  |  ");

  const plain = tpl.header === "plain";

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm text-[#1a1a1a]"
      style={{ fontFamily, padding: compact ? 28 : 36, lineHeight: 1.5, fontSize: 13 }}
    >
      {/* Header */}
      {tpl.header === "band" ? (
        <div style={{ background: tpl.accent, color: "#fff", margin: compact ? -28 : -36, marginBottom: 20, padding: compact ? "20px 28px" : "24px 36px" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{profile.name || "Your Name"}</div>
          {contact1 ? <div style={{ fontSize: 11, opacity: 0.95, marginTop: 2 }}>{contact1}</div> : null}
          {contact2 ? <div style={{ fontSize: 11, opacity: 0.95 }}>{contact2}</div> : null}
        </div>
      ) : (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{profile.name || "Your Name"}</div>
          {contact1 ? <div style={{ fontSize: 11, color: "#555" }}>{contact1}</div> : null}
          {contact2 ? <div style={{ fontSize: 11, color: "#555" }}>{contact2}</div> : null}
          {tpl.header === "rule" ? <hr style={{ border: 0, borderTop: "1px solid #111", marginTop: 8 }} /> : null}
        </div>
      )}

      {profile.summary ? (
        <>
          <PreviewHeading accent={tpl.accent} plain={plain} compact={compact}>Professional Summary</PreviewHeading>
          <p style={{ margin: 0 }}>{profile.summary}</p>
        </>
      ) : null}

      {profile.skills ? (
        <>
          <PreviewHeading accent={tpl.accent} plain={plain} compact={compact}>Core Skills</PreviewHeading>
          <p style={{ margin: 0 }}>{profile.skills}</p>
        </>
      ) : null}

      {profile.experience.length ? <PreviewHeading accent={tpl.accent} plain={plain} compact={compact}>Professional Experience</PreviewHeading> : null}
      {profile.experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: compact ? 8 : 12 }}>
          <div style={{ fontWeight: 700 }}>
            {exp.role}
            {exp.company ? ` — ${exp.company}` : ""}
          </div>
          {[exp.start, exp.end].filter(Boolean).length ? (
            <div style={{ fontSize: 11, color: "#777", fontStyle: "italic" }}>
              {[exp.start, exp.end].filter(Boolean).join(" – ")}
            </div>
          ) : null}
          <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
            {exp.bullets
              .split("\n")
              .map((b) => b.replace(/^[-•]\s*/, "").trim())
              .filter(Boolean)
              .map((b, j) => (
                <li key={j} style={{ marginBottom: 2 }}>
                  {b}
                </li>
              ))}
          </ul>
          {exp.tools ? <div style={{ fontSize: 11 }}><strong>Tools:</strong> {exp.tools}</div> : null}
        </div>
      ))}

      {profile.education.length ? <PreviewHeading accent={tpl.accent} plain={plain} compact={compact}>Education</PreviewHeading> : null}
      {profile.education.map((ed, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 700 }}>{ed.degree || ed.institution}</div>
          <div style={{ fontSize: 11, color: "#555" }}>{[ed.institution, ed.year].filter(Boolean).join(", ")}</div>
        </div>
      ))}

      {profile.certs ? (
        <>
          <PreviewHeading accent={tpl.accent} plain={plain} compact={compact}>Certifications</PreviewHeading>
          <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
            {profile.certs
              .split("\n")
              .filter(Boolean)
              .map((c, i) => (
                <li key={i}>{c.trim()}</li>
              ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
