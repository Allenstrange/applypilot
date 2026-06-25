import type { Profile, TemplateId, SectionKey } from "@/lib/types";
import { resolveTemplate, DEFAULT_SECTION_ORDER, type ResolvedTemplate, type StyleOverrides } from "@/lib/templates";
import { parseBullets, parseLines } from "@/lib/resumeFormat";

function fontFamily(font: "serif" | "sans" | "mono"): string {
  if (font === "serif") return "Georgia, 'Times New Roman', serif";
  if (font === "mono") return "'Courier New', Courier, monospace";
  return "Arial, Helvetica, sans-serif";
}

const DENSITY = {
  compact: { pad: 28, lh: 1.38, sec: 9, bullet: 1, head: 12 },
  normal: { pad: 36, lh: 1.5, sec: 12, bullet: 2, head: 16 },
  relaxed: { pad: 44, lh: 1.66, sec: 16, bullet: 4, head: 22 },
};

function PreviewHeading({
  tpl,
  marginTop,
  children,
}: {
  tpl: ResolvedTemplate;
  marginTop: number;
  children: string;
}) {
  const underlineWidth = tpl.header === "plain" ? 1 : 2;
  return (
    <h2
      style={{
        color: tpl.accent,
        fontSize: 12,
        fontWeight: 700,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        letterSpacing: tpl.headingUppercase ? 1 : 0,
        marginTop,
        marginBottom: 6,
        borderBottom: tpl.headingUnderline ? `${underlineWidth}px solid ${tpl.accent}` : "none",
        paddingBottom: tpl.headingUnderline ? 3 : 0,
      }}
    >
      {children}
    </h2>
  );
}

function SingleColumn({
  profile,
  tpl,
  order,
}: {
  profile: Profile;
  tpl: ResolvedTemplate;
  order: SectionKey[];
}) {
  const d = DENSITY[tpl.density];
  const contact1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("  |  ");

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary ? (
      <div key="summary">
        <PreviewHeading tpl={tpl} marginTop={d.head}>Professional Summary</PreviewHeading>
        <p style={{ margin: 0 }}>{profile.summary}</p>
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        <PreviewHeading tpl={tpl} marginTop={d.head}>Core Skills</PreviewHeading>
        <p style={{ margin: 0 }}>{profile.skills}</p>
      </div>
    ) : null,
    experience: profile.experience.length ? (
      <div key="experience">
        <PreviewHeading tpl={tpl} marginTop={d.head}>Professional Experience</PreviewHeading>
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: d.sec }}>
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
              {parseBullets(exp.bullets).map((b, j) => (
                <li key={j} style={{ marginBottom: d.bullet }}>{b}</li>
              ))}
            </ul>
            {exp.tools ? <div style={{ fontSize: 11 }}><strong>Tools:</strong> {exp.tools}</div> : null}
          </div>
        ))}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        <PreviewHeading tpl={tpl} marginTop={d.head}>Education</PreviewHeading>
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700 }}>{ed.degree || ed.institution}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{[ed.institution, ed.year].filter(Boolean).join(", ")}</div>
          </div>
        ))}
      </div>
    ) : null,
    certs: profile.certs ? (
      <div key="certs">
        <PreviewHeading tpl={tpl} marginTop={d.head}>Certifications</PreviewHeading>
        <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
          {parseLines(profile.certs).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    ) : null,
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm text-[#1a1a1a]"
      style={{ fontFamily: fontFamily(tpl.font), padding: d.pad, lineHeight: d.lh, fontSize: 13 }}
    >
      {tpl.header === "band" ? (
        <div style={{ background: tpl.accent, color: "#fff", margin: -d.pad, marginBottom: 20, padding: `${d.pad * 0.6}px ${d.pad}px` }}>
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

      {order.map((key) => sections[key])}
    </div>
  );
}

export default function ResumePreview({
  profile,
  templateId,
  accent,
  font,
  density,
  headingUppercase,
  headingUnderline,
  sectionOrder,
}: {
  profile: Profile;
  templateId: TemplateId;
  /** Custom section order; falls back to the default order. */
  sectionOrder?: SectionKey[];
} & StyleOverrides) {
  const tpl = resolveTemplate(templateId, { accent, font, density, headingUppercase, headingUnderline });
  const order = sectionOrder?.length ? sectionOrder : DEFAULT_SECTION_ORDER;
  return <SingleColumn profile={profile} tpl={tpl} order={order} />;
}
