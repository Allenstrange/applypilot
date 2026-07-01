import type { Profile, TemplateId, SectionKey } from "@/lib/types";
import {
  resolveTemplate,
  DEFAULT_SECTION_ORDER,
  type ResolvedTemplate,
  type StyleOverrides,
} from "@/lib/templates";
import { parseBullets, parseLines, parseList } from "@/lib/resumeFormat";

// Six distinct layout engines, each replicating a reference design:
// classicClear (FlowCV Classic Clear), sidebar (Atlantic Blue), banded
// (Mercury Flow), labelLeft (editorial "Ledger"), headline (bold ATS),
// slate (Rezi-style clean sans). PDF parity lives in lib/resumePdf.ts.

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

type Dz = (typeof DENSITY)["normal"];

function caps(tpl: ResolvedTemplate, label: string): string {
  return tpl.headingUppercase ? label.toUpperCase() : label;
}

function dates(start: string, end: string): string {
  return [start, end].filter(Boolean).join(" – ");
}

function Bullets({
  items,
  gap,
  size = 12.5,
}: {
  items: string[];
  gap: number;
  size?: number;
}) {
  if (!items.length) return null;
  return (
    <ul style={{ margin: "4px 0", paddingLeft: 16, listStyle: "disc", fontSize: size }}>
      {items.map((b, j) => (
        <li key={j} style={{ marginBottom: gap }}>{b}</li>
      ))}
    </ul>
  );
}

function TwoColList({ items, size = 12.5 }: { items: string[]; size?: number }) {
  if (!items.length) return null;
  return (
    <ul
      style={{
        margin: "4px 0",
        paddingLeft: 16,
        listStyle: "disc",
        fontSize: size,
        columnCount: 2,
        columnGap: 28,
      }}
    >
      {items.map((s, i) => (
        <li key={i} style={{ marginBottom: 2, breakInside: "avoid" }}>{s}</li>
      ))}
    </ul>
  );
}

function Page({
  tpl,
  dz,
  children,
  pad = true,
}: {
  tpl: ResolvedTemplate;
  dz: Dz;
  children: React.ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm text-[#1a1a1a]"
      style={{
        fontFamily: fontFamily(tpl.font),
        padding: pad ? dz.pad : 0,
        lineHeight: dz.lh,
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- classicClear

function ClassicClear({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const contact = [profile.location, profile.email, profile.phone, profile.linkedin]
    .filter(Boolean)
    .join("   •   ");

  const heading = (label: string) => (
    <h2
      style={{
        fontSize: 12.5,
        fontWeight: 700,
        color: tpl.accent,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        letterSpacing: tpl.headingUppercase ? 1 : 0,
        marginTop: dz.head,
        marginBottom: 6,
        borderBottom: tpl.headingUnderline ? `1px solid ${tpl.accent}` : "none",
        paddingBottom: tpl.headingUnderline ? 3 : 0,
      }}
    >
      {label}
    </h2>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary ? (
      <div key="summary">
        {heading("Summary")}
        <p style={{ margin: 0 }}>{profile.summary}</p>
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        {heading("Skills")}
        <TwoColList items={parseList(profile.skills)} />
      </div>
    ) : null,
    experience: profile.experience.length ? (
      <div key="experience">
        {heading("Professional Experience")}
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: dz.sec }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700 }}>{exp.role}</span>
              <span style={{ fontSize: 11.5 }}>{dates(exp.start, exp.end)}</span>
            </div>
            {exp.company ? (
              <div style={{ fontStyle: "italic", fontSize: 12 }}>{exp.company}</div>
            ) : null}
            <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet} />
            {exp.tools ? (
              <div style={{ fontSize: 11 }}><strong>Tools:</strong> {exp.tools}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        {heading("Education")}
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700 }}>{ed.degree || ed.institution}</span>
              <span style={{ fontSize: 11.5 }}>{ed.year}</span>
            </div>
            {ed.degree && ed.institution ? (
              <div style={{ fontStyle: "italic", fontSize: 12 }}>{ed.institution}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    certs: profile.certs ? (
      <div key="certs">
        {heading("Certificates")}
        <TwoColList items={parseLines(profile.certs)} />
      </div>
    ) : null,
  };

  return (
    <Page tpl={tpl} dz={dz}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111" }}>
          {profile.name || "Your Name"}
        </div>
        {profile.title ? (
          <div style={{ fontStyle: "italic", fontSize: 13.5, marginTop: 1 }}>{profile.title}</div>
        ) : null}
        {contact ? (
          <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{contact}</div>
        ) : null}
      </div>
      {order.map((key) => sections[key])}
    </Page>
  );
}

// ---------------------------------------------------------------- slate

function Slate({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const contact = [profile.location, profile.email, profile.phone, profile.linkedin]
    .filter(Boolean)
    .join("   •   ");

  const heading = (label: string) => (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: tpl.accent,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        letterSpacing: tpl.headingUppercase ? 0.8 : 0,
        marginTop: dz.head,
        marginBottom: 7,
        borderBottom: tpl.headingUnderline ? "1px solid #d7dce1" : "none",
        paddingBottom: tpl.headingUnderline ? 5 : 0,
      }}
    >
      {label}
    </h2>
  );

  const entryHead = (left: string, right: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontWeight: 700, fontSize: 12.5 }}>{left}</span>
      <span style={{ fontSize: 11, color: "#5a6572" }}>{right}</span>
    </div>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary ? (
      <div key="summary">
        {heading("Professional Summary")}
        <p style={{ margin: 0 }}>{profile.summary}</p>
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        {heading("Skills")}
        <p style={{ margin: 0, fontWeight: 500 }}>{profile.skills}</p>
      </div>
    ) : null,
    experience: profile.experience.length ? (
      <div key="experience">
        {heading("Professional Experience")}
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: dz.sec }}>
            {entryHead(exp.role, dates(exp.start, exp.end))}
            {exp.company ? (
              <div style={{ fontSize: 12, color: "#3c4652" }}>{exp.company}</div>
            ) : null}
            <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet} size={12} />
            {exp.tools ? (
              <div style={{ fontSize: 11, color: "#5a6572" }}>Tools: {exp.tools}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        {heading("Education")}
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 5 }}>
            {entryHead(ed.degree || ed.institution, ed.year)}
            {ed.degree && ed.institution ? (
              <div style={{ fontSize: 12, color: "#3c4652" }}>{ed.institution}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    certs: profile.certs ? (
      <div key="certs">
        {heading("Certifications")}
        <Bullets items={parseLines(profile.certs)} gap={1} size={12} />
      </div>
    ) : null,
  };

  return (
    <Page tpl={tpl} dz={dz}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: tpl.accent }}>
          {profile.name || "Your Name"}
        </div>
        {contact ? (
          <div style={{ fontSize: 11, color: "#5a6572", marginTop: 3 }}>{contact}</div>
        ) : null}
      </div>
      {order.map((key) => sections[key])}
    </Page>
  );
}

// ---------------------------------------------------------------- headline

function Headline({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const contact = [profile.location, profile.email, profile.phone, profile.linkedin]
    .filter(Boolean)
    .join(" | ");

  const heading = (label: string) => (
    <h2
      style={{
        fontSize: 14.5,
        fontWeight: 800,
        color: tpl.accent,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        marginTop: dz.head + 2,
        marginBottom: 8,
        borderBottom: tpl.headingUnderline ? `2px solid ${tpl.accent}` : "none",
        paddingBottom: tpl.headingUnderline ? 4 : 0,
      }}
    >
      {label}
    </h2>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary ? (
      <div key="summary">
        {heading("Professional Summary")}
        <p style={{ margin: 0 }}>{profile.summary}</p>
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        {heading("Skills")}
        <Bullets items={parseList(profile.skills)} gap={2} size={12.5} />
      </div>
    ) : null,
    experience: profile.experience.length ? (
      <div key="experience">
        {heading("Work Experience")}
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: dz.sec + 2 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{exp.role}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{exp.company}</span>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{dates(exp.start, exp.end)}</span>
            </div>
            <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet + 1} />
            {exp.tools ? (
              <div style={{ fontSize: 11.5 }}><strong>Tools:</strong> {exp.tools}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        {heading("Education")}
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>{ed.degree || ed.institution}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, fontSize: 11.5 }}>
                {ed.degree ? ed.institution : ""}
              </span>
              <span style={{ fontWeight: 700, fontSize: 11.5 }}>
                {ed.year ? `Graduated: ${ed.year}` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : null,
    certs: profile.certs ? (
      <div key="certs">
        {heading("Certifications")}
        <Bullets items={parseLines(profile.certs)} gap={2} />
      </div>
    ) : null,
  };

  return (
    <Page tpl={tpl} dz={dz}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: tpl.accent,
            textTransform: "uppercase",
            letterSpacing: 1,
            lineHeight: 1.1,
          }}
        >
          {profile.name || "Your Name"}
        </div>
        {profile.title ? (
          <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8 }}>{profile.title}</div>
        ) : null}
        {contact ? (
          <div style={{ fontSize: 12, marginTop: 6 }}>{contact}</div>
        ) : null}
      </div>
      {order.map((key) => sections[key])}
    </Page>
  );
}

// ---------------------------------------------------------------- sidebar (Atlantic Blue)

const SIDEBAR_SECTIONS: SectionKey[] = ["experience", "education", "skills"];

function Sidebar({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const mainOrder = order.filter((k) => SIDEBAR_SECTIONS.includes(k));

  const sideHeading = (label: string) => (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        borderBottom: "1px solid rgba(255,255,255,0.35)",
        paddingBottom: 4,
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  );

  const bannerHeading = (label: string) => (
    <div
      style={{
        background: "#eef1f4",
        color: "#26313c",
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        letterSpacing: tpl.headingUppercase ? 1 : 0,
        padding: "5px 10px",
        marginTop: dz.head,
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  );

  const main: Record<string, React.ReactNode> = {
    experience: profile.experience.length ? (
      <div key="experience">
        {bannerHeading("Work Experience")}
        {profile.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: dz.sec }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>{exp.company || exp.role}</div>
            {exp.company ? <div style={{ fontSize: 12 }}>{exp.role}</div> : null}
            <div style={{ fontSize: 10.5, color: "#5a6572", marginBottom: 2 }}>
              {dates(exp.start, exp.end)}
            </div>
            <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet} size={11.5} />
            {exp.tools ? (
              <div style={{ fontSize: 10.5, color: "#5a6572" }}>Tools: {exp.tools}</div>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        {bannerHeading("Education")}
        {profile.education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{ed.degree || ed.institution}</div>
            <div style={{ fontSize: 10.5, color: "#5a6572" }}>
              {[ed.degree ? ed.institution : "", ed.year].filter(Boolean).join("  |  ")}
            </div>
          </div>
        ))}
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        {bannerHeading("Skills")}
        <Bullets items={parseList(profile.skills)} gap={2} size={11.5} />
      </div>
    ) : null,
  };

  const contactItems = [profile.email, profile.phone, profile.location, profile.linkedin].filter(
    Boolean,
  );

  return (
    <Page tpl={tpl} dz={dz} pad={false}>
      <div style={{ display: "grid", gridTemplateColumns: "34% 1fr", minHeight: 420 }}>
        <div style={{ background: tpl.accent, color: "#fff", padding: dz.pad * 0.7 }}>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
            {profile.name || "Your Name"}
          </div>
          {profile.title ? (
            <div style={{ fontSize: 12, marginTop: 5, opacity: 0.92 }}>{profile.title}</div>
          ) : null}
          {contactItems.length ? (
            <div style={{ marginTop: 16 }}>
              {contactItems.map((c, i) => (
                <div key={i} style={{ fontSize: 10.5, opacity: 0.92, marginBottom: 4, wordBreak: "break-word" }}>
                  {c}
                </div>
              ))}
            </div>
          ) : null}
          {profile.summary ? (
            <div>
              {sideHeading("Profile")}
              <p style={{ margin: 0, fontSize: 10.5, opacity: 0.92, lineHeight: 1.55 }}>
                {profile.summary}
              </p>
            </div>
          ) : null}
          {profile.certs ? (
            <div>
              {sideHeading("Certifications")}
              {parseLines(profile.certs).map((c, i) => (
                <div key={i} style={{ fontSize: 10.5, opacity: 0.92, marginBottom: 4 }}>{c}</div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ padding: dz.pad * 0.7, paddingTop: dz.pad * 0.45 }}>
          {mainOrder.map((key) => main[key])}
        </div>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------- banded (Mercury Flow)

function Banded({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const contact = [profile.email, profile.phone, profile.linkedin, profile.location]
    .filter(Boolean)
    .join("   ·   ");

  const heading = (label: string) => (
    <div
      style={{
        background: "#f1f3f5",
        color: tpl.accent,
        textAlign: "center",
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: tpl.headingUppercase ? "uppercase" : "none",
        letterSpacing: tpl.headingUppercase ? 0.8 : 0,
        padding: "4px 8px",
        marginTop: dz.head,
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  );

  const railRow = (
    rail: React.ReactNode,
    body: React.ReactNode,
    key: number,
    gap: number,
  ) => (
    <div key={key} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, marginBottom: gap }}>
      <div style={{ fontSize: 10.5, color: "#555f6a" }}>{rail}</div>
      <div>{body}</div>
    </div>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary ? (
      <div key="summary">
        {heading("Summary")}
        <p style={{ margin: 0, fontSize: 12.5 }}>{profile.summary}</p>
      </div>
    ) : null,
    skills: profile.skills ? (
      <div key="skills">
        {heading("Skills")}
        <ul
          style={{
            margin: "2px 0",
            paddingLeft: 16,
            listStyle: "disc",
            fontSize: 12,
            columnCount: 3,
            columnGap: 20,
          }}
        >
          {parseList(profile.skills).map((s, i) => (
            <li key={i} style={{ marginBottom: 2, breakInside: "avoid" }}>{s}</li>
          ))}
        </ul>
      </div>
    ) : null,
    experience: profile.experience.length ? (
      <div key="experience">
        {heading("Professional Experience")}
        {profile.experience.map((exp, i) =>
          railRow(
            <>
              <div>{dates(exp.start, exp.end)}</div>
            </>,
            <>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>{exp.company || exp.role}</div>
              {exp.company ? <div style={{ fontSize: 12 }}>{exp.role}</div> : null}
              <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet} size={11.5} />
              {exp.tools ? (
                <div style={{ fontSize: 10.5, color: "#555f6a" }}>Tools: {exp.tools}</div>
              ) : null}
            </>,
            i,
            dz.sec,
          ),
        )}
      </div>
    ) : null,
    education: profile.education.length ? (
      <div key="education">
        {heading("Education")}
        {profile.education.map((ed, i) =>
          railRow(
            <div>{ed.year}</div>,
            <>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{ed.degree || ed.institution}</div>
              {ed.degree && ed.institution ? (
                <div style={{ fontSize: 11.5, color: "#3c4652" }}>{ed.institution}</div>
              ) : null}
            </>,
            i,
            6,
          ),
        )}
      </div>
    ) : null,
    certs: profile.certs ? (
      <div key="certs">
        {heading("Certifications")}
        <Bullets items={parseLines(profile.certs)} gap={2} size={12} />
      </div>
    ) : null,
  };

  return (
    <Page tpl={tpl} dz={dz}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: "#1c242c" }}>
          {profile.name || "Your Name"}
        </div>
        {profile.title ? (
          <div style={{ fontSize: 12.5, color: "#3c4652", marginTop: 1 }}>{profile.title}</div>
        ) : null}
        {contact ? (
          <div style={{ fontSize: 10.5, color: "#555f6a", marginTop: 5 }}>{contact}</div>
        ) : null}
      </div>
      {order.map((key) => sections[key])}
    </Page>
  );
}

// ---------------------------------------------------------------- labelLeft (Ledger)

function LabelLeft({ profile, tpl, order }: LayoutProps) {
  const dz = DENSITY[tpl.density];
  const contact = [profile.location, profile.phone, profile.email, profile.linkedin]
    .filter(Boolean)
    .join("  ·  ");

  const LABELS: Record<SectionKey, string> = {
    summary: "Profile",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    certs: "Certificates",
  };

  const section = (key: SectionKey, body: React.ReactNode) => (
    <div
      key={key}
      style={{
        display: "grid",
        gridTemplateColumns: "105px 1fr",
        gap: 16,
        borderTop: tpl.headingUnderline ? "1px solid #e4e0da" : "none",
        paddingTop: 12,
        marginTop: dz.head - 2,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: tpl.headingUppercase ? "uppercase" : "none",
          letterSpacing: tpl.headingUppercase ? 1.4 : 0,
          color: tpl.accent,
          paddingTop: 2,
        }}
      >
        {caps(tpl, LABELS[key])}
      </div>
      <div>{body}</div>
    </div>
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    summary: profile.summary
      ? section("summary", <p style={{ margin: 0, fontSize: 12.5 }}>{profile.summary}</p>)
      : null,
    skills: profile.skills
      ? section("skills", <TwoColList items={parseList(profile.skills)} size={12} />)
      : null,
    experience: profile.experience.length
      ? section(
          "experience",
          <>
            {profile.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: dz.sec }}>
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                  {[exp.role, exp.company].filter(Boolean).join(", ")}
                </div>
                <div style={{ fontSize: 11, color: "#6c675f", fontStyle: "italic", marginBottom: 2 }}>
                  {dates(exp.start, exp.end)}
                </div>
                <Bullets items={parseBullets(exp.bullets)} gap={dz.bullet} size={11.5} />
                {exp.tools ? (
                  <div style={{ fontSize: 10.5, color: "#6c675f" }}>Tools: {exp.tools}</div>
                ) : null}
              </div>
            ))}
          </>,
        )
      : null,
    education: profile.education.length
      ? section(
          "education",
          <>
            {profile.education.map((ed, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{ed.degree || ed.institution}</div>
                <div style={{ fontSize: 11, color: "#6c675f", fontStyle: "italic" }}>
                  {[ed.degree ? ed.institution : "", ed.year].filter(Boolean).join(", ")}
                </div>
              </div>
            ))}
          </>,
        )
      : null,
    certs: profile.certs
      ? section("certs", <Bullets items={parseLines(profile.certs)} gap={2} size={11.5} />)
      : null,
  };

  return (
    <Page tpl={tpl} dz={dz}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#232019" }}>
          {[profile.name || "Your Name", profile.title].filter(Boolean).join(", ")}
        </div>
        {contact ? (
          <div style={{ fontSize: 10.5, color: "#6c675f", marginTop: 3 }}>{contact}</div>
        ) : null}
      </div>
      {order.map((key) => sections[key])}
    </Page>
  );
}

// ---------------------------------------------------------------- dispatcher

interface LayoutProps {
  profile: Profile;
  tpl: ResolvedTemplate;
  order: SectionKey[];
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
  const props = { profile, tpl, order };
  switch (tpl.layout) {
    case "sidebar":
      return <Sidebar {...props} />;
    case "banded":
      return <Banded {...props} />;
    case "labelLeft":
      return <LabelLeft {...props} />;
    case "headline":
      return <Headline {...props} />;
    case "slate":
      return <Slate {...props} />;
    default:
      return <ClassicClear {...props} />;
  }
}
