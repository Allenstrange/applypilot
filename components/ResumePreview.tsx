import type { Profile, TemplateId } from "@/lib/types";
import { getTemplate, type TemplateDef } from "@/lib/templates";

function parseBullets(str: string): string[] {
  return str
    .split("\n")
    .map((b) => b.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

function parseList(str: string): string[] {
  return str
    .split(/[\n·|,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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

// ---------------- Single-column layout ----------------

function SingleColumn({ profile, tpl }: { profile: Profile; tpl: TemplateDef }) {
  const fontFamily = tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const compact = tpl.id === "compact";
  const plain = tpl.header === "plain";

  const contact1 = [profile.title, profile.location].filter(Boolean).join("  |  ");
  const contact2 = [profile.email, profile.phone, profile.linkedin].filter(Boolean).join("  |  ");

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm text-[#1a1a1a]"
      style={{ fontFamily, padding: compact ? 28 : 36, lineHeight: 1.5, fontSize: 13 }}
    >
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
            {parseBullets(exp.bullets).map((b, j) => (
              <li key={j} style={{ marginBottom: 2 }}>{b}</li>
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
            {profile.certs.split("\n").filter(Boolean).map((c, i) => (
              <li key={i}>{c.trim()}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

// ---------------- Two-column (sidebar) layout ----------------

function SideHeading({ children, color, border }: { children: string; color: string; border: string }) {
  return (
    <div
      style={{
        color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 18,
        marginBottom: 6,
        paddingBottom: 3,
        borderBottom: `1px solid ${border}`,
      }}
    >
      {children}
    </div>
  );
}

function MainHeading({ children, color }: { children: string; color: string }) {
  return (
    <h2
      style={{
        color,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 16,
        marginBottom: 6,
        borderBottom: `2px solid ${color}`,
        paddingBottom: 3,
      }}
    >
      {children}
    </h2>
  );
}

function SidebarLayout({ profile, tpl }: { profile: Profile; tpl: TemplateDef }) {
  const fontFamily = tpl.font === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const solid = tpl.sidebarStyle === "solid";

  const sideBg = solid ? tpl.accent : hexToRgba(tpl.accent, 0.09);
  const sideText = solid ? "rgba(255,255,255,0.92)" : "#374151";
  const sideHeadColor = solid ? "#ffffff" : tpl.accent;
  const sideHeadBorder = solid ? "rgba(255,255,255,0.3)" : hexToRgba(tpl.accent, 0.35);
  const mainAccent = solid ? "#111827" : tpl.accent;

  const contacts = [profile.email, profile.phone, profile.location, profile.linkedin].filter(Boolean);
  const skills = parseList(profile.skills);
  const certs = profile.certs.split("\n").map((c) => c.trim()).filter(Boolean);

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-[#1a1a1a]"
      style={{ fontFamily, fontSize: 13, lineHeight: 1.5, display: "flex", alignItems: "stretch" }}
    >
      {/* Sidebar */}
      <aside style={{ width: "34%", background: sideBg, color: sideText, padding: "26px 22px" }}>
        {contacts.length ? (
          <>
            <SideHeading color={sideHeadColor} border={sideHeadBorder}>Contact</SideHeading>
            {contacts.map((c, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 3, wordBreak: "break-word" }}>{c}</div>
            ))}
          </>
        ) : null}

        {skills.length ? (
          <>
            <SideHeading color={sideHeadColor} border={sideHeadBorder}>Skills</SideHeading>
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
            <SideHeading color={sideHeadColor} border={sideHeadBorder}>Education</SideHeading>
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
            <SideHeading color={sideHeadColor} border={sideHeadBorder}>Certifications</SideHeading>
            {certs.map((c, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 3 }}>{c}</div>
            ))}
          </>
        ) : null}
      </aside>

      {/* Main column */}
      <main style={{ flex: 1, padding: "28px 28px" }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{profile.name || "Your Name"}</div>
        {profile.title ? <div style={{ fontSize: 13, color: mainAccent, fontWeight: 600, marginTop: 2 }}>{profile.title}</div> : null}

        {profile.summary ? (
          <>
            <MainHeading color={mainAccent}>Professional Summary</MainHeading>
            <p style={{ margin: 0 }}>{profile.summary}</p>
          </>
        ) : null}

        {profile.experience.length ? <MainHeading color={mainAccent}>Professional Experience</MainHeading> : null}
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
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
                <li key={j} style={{ marginBottom: 2 }}>{b}</li>
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
}: {
  profile: Profile;
  templateId: TemplateId;
  /** Optional accent-colour override (customization). */
  accent?: string;
  /** Optional body-font override (customization). */
  font?: "serif" | "sans";
}) {
  const base = getTemplate(templateId);
  const tpl: TemplateDef = {
    ...base,
    ...(accent ? { accent } : {}),
    ...(font ? { font } : {}),
  };
  if (tpl.layout === "sidebar") return <SidebarLayout profile={profile} tpl={tpl} />;
  return <SingleColumn profile={profile} tpl={tpl} />;
}
