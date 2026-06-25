import type { Profile, TemplateId } from "@/lib/types";
import { resolveTemplate, type ResolvedTemplate, type StyleOverrides } from "@/lib/templates";
import { parseBullets, parseList, parseLines } from "@/lib/resumeFormat";

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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

// ---------------- Single-column layout ----------------

function SingleColumn({ profile, tpl }: { profile: Profile; tpl: ResolvedTemplate }) {
  const d = DENSITY[tpl.density];
  const contact1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("  |  ");

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

      {profile.summary ? (
        <>
          <PreviewHeading tpl={tpl} marginTop={d.head}>Professional Summary</PreviewHeading>
          <p style={{ margin: 0 }}>{profile.summary}</p>
        </>
      ) : null}

      {profile.skills ? (
        <>
          <PreviewHeading tpl={tpl} marginTop={d.head}>Core Skills</PreviewHeading>
          <p style={{ margin: 0 }}>{profile.skills}</p>
        </>
      ) : null}

      {profile.experience.length ? <PreviewHeading tpl={tpl} marginTop={d.head}>Professional Experience</PreviewHeading> : null}
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

      {profile.education.length ? <PreviewHeading tpl={tpl} marginTop={d.head}>Education</PreviewHeading> : null}
      {profile.education.map((ed, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 700 }}>{ed.degree || ed.institution}</div>
          <div style={{ fontSize: 11, color: "#555" }}>{[ed.institution, ed.year].filter(Boolean).join(", ")}</div>
        </div>
      ))}

      {profile.certs ? (
        <>
          <PreviewHeading tpl={tpl} marginTop={d.head}>Certifications</PreviewHeading>
          <ul style={{ margin: "4px 0", paddingLeft: 18, listStyle: "disc" }}>
            {parseLines(profile.certs).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

// ---------------- Two-column (sidebar) layout ----------------

function SidebarHead({ uppercase, underline, color, border, children }: { uppercase: boolean; underline: boolean; color: string; border: string; children: string }) {
  return (
    <div
      style={{
        color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: uppercase ? "uppercase" : "none",
        letterSpacing: uppercase ? 1 : 0,
        marginTop: 18,
        marginBottom: 6,
        paddingBottom: underline ? 3 : 0,
        borderBottom: underline ? `1px solid ${border}` : "none",
      }}
    >
      {children}
    </div>
  );
}

function MainHead({ uppercase, underline, color, children }: { uppercase: boolean; underline: boolean; color: string; children: string }) {
  return (
    <h2
      style={{
        color,
        fontSize: 12,
        fontWeight: 700,
        textTransform: uppercase ? "uppercase" : "none",
        letterSpacing: uppercase ? 1 : 0,
        marginTop: 16,
        marginBottom: 6,
        borderBottom: underline ? `2px solid ${color}` : "none",
        paddingBottom: underline ? 3 : 0,
      }}
    >
      {children}
    </h2>
  );
}

function SidebarLayout({ profile, tpl }: { profile: Profile; tpl: ResolvedTemplate }) {
  const d = DENSITY[tpl.density];
  const solid = tpl.sidebarStyle === "solid";

  const sideBg = solid ? tpl.accent : hexToRgba(tpl.accent, 0.09);
  const sideText = solid ? "rgba(255,255,255,0.92)" : "#374151";
  const sideHeadColor = solid ? "#ffffff" : tpl.accent;
  const sideHeadBorder = solid ? "rgba(255,255,255,0.3)" : hexToRgba(tpl.accent, 0.35);
  const mainAccent = solid ? "#111827" : tpl.accent;
  const up = tpl.headingUppercase;
  const ul = tpl.headingUnderline;

  const contacts = [profile.email, profile.phone, profile.location, profile.linkedin].filter(Boolean);
  const skills = parseList(profile.skills);
  const certs = parseLines(profile.certs);

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-[#1a1a1a]"
      style={{ fontFamily: fontFamily(tpl.font), fontSize: 13, lineHeight: d.lh, display: "flex", alignItems: "stretch" }}
    >
      {/* Sidebar */}
      <aside style={{ width: "34%", background: sideBg, color: sideText, padding: `${d.pad * 0.75}px ${d.pad * 0.6}px` }}>
        {contacts.length ? (
          <>
            <SidebarHead uppercase={up} underline={ul} color={sideHeadColor} border={sideHeadBorder}>Contact</SidebarHead>
            {contacts.map((c, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 3, wordBreak: "break-word" }}>{c}</div>
            ))}
          </>
        ) : null}

        {skills.length ? (
          <>
            <SidebarHead uppercase={up} underline={ul} color={sideHeadColor} border={sideHeadBorder}>Skills</SidebarHead>
            {skills.map((s, i) => (
              <div key={i} style={{ fontSize: 11.5, marginBottom: 3, display: "flex", gap: 6 }}>
                <span style={{ color: solid ? "rgba(255,255,255,0.7)" : tpl.accent }}>•</span>
                <span>{s}</span>
              </div>
            ))}
          </>
        ) : null}

        {profile.education.length ? (
          <>
            <SidebarHead uppercase={up} underline={ul} color={sideHeadColor} border={sideHeadBorder}>Education</SidebarHead>
            {profile.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700 }}>{ed.degree || ed.institution}</div>
                <div style={{ fontSize: 10.5, opacity: 0.85 }}>{[ed.institution, ed.year].filter(Boolean).join(", ")}</div>
              </div>
            ))}
          </>
        ) : null}

        {certs.length ? (
          <>
            <SidebarHead uppercase={up} underline={ul} color={sideHeadColor} border={sideHeadBorder}>Certifications</SidebarHead>
            {certs.map((c, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 3 }}>{c}</div>
            ))}
          </>
        ) : null}
      </aside>

      {/* Main column */}
      <main style={{ flex: 1, padding: `${d.pad * 0.8}px ${d.pad * 0.8}px` }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{profile.name || "Your Name"}</div>
        {profile.title ? <div style={{ fontSize: 13, color: mainAccent, fontWeight: 600, marginTop: 2 }}>{profile.title}</div> : null}

        {profile.summary ? (
          <>
            <MainHead uppercase={up} underline={ul} color={mainAccent}>Professional Summary</MainHead>
            <p style={{ margin: 0 }}>{profile.summary}</p>
          </>
        ) : null}

        {profile.experience.length ? <MainHead uppercase={up} underline={ul} color={mainAccent}>Professional Experience</MainHead> : null}
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
      </main>
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
}: {
  profile: Profile;
  templateId: TemplateId;
} & StyleOverrides) {
  const tpl = resolveTemplate(templateId, { accent, font, density, headingUppercase, headingUnderline });
  if (tpl.layout === "sidebar") return <SidebarLayout profile={profile} tpl={tpl} />;
  return <SingleColumn profile={profile} tpl={tpl} />;
}
