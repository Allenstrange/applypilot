// ============== PLAIN-TEXT (.txt) RÉSUMÉ EXPORT ==============
// ATS application forms often want raw text pasted in. This builds a clean,
// machine-readable plain-text version of a résumé — no styling, no glyphs that
// confuse parsers — and downloads it.

import type { Profile } from "./types";
import { parseBullets, parseList, parseLines } from "./resumeFormat";
import { downloadText, slugify } from "./download";

function section(title: string, body: string): string {
  return `${title.toUpperCase()}\n${"-".repeat(title.length)}\n${body}`.trim();
}

/** Build an ATS-friendly plain-text résumé from a profile. */
export function buildResumeText(p: Profile): string {
  const blocks: string[] = [];

  const header = [
    (p.name || "Your Name").toUpperCase(),
    [p.title, p.location].filter(Boolean).join(" | "),
    [p.email, p.phone, p.linkedin].filter(Boolean).join(" | "),
  ]
    .filter(Boolean)
    .join("\n");
  blocks.push(header);

  if (p.summary?.trim()) {
    blocks.push(section("Professional Summary", p.summary.trim()));
  }

  const skills = parseList(p.skills);
  if (skills.length) {
    blocks.push(section("Core Skills", skills.join(", ")));
  }

  if (p.experience?.length) {
    const body = p.experience
      .map((e) => {
        const head = [e.role, e.company].filter(Boolean).join(" — ");
        const dates = [e.start, e.end].filter(Boolean).join(" – ");
        const bullets = parseBullets(e.bullets)
          .map((b) => `- ${b}`)
          .join("\n");
        const tools = e.tools?.trim() ? `Tools: ${e.tools.trim()}` : "";
        return [head, dates, bullets, tools].filter(Boolean).join("\n");
      })
      .join("\n\n");
    blocks.push(section("Professional Experience", body));
  }

  if (p.education?.length) {
    const body = p.education
      .map((ed) =>
        [ed.degree, [ed.institution, ed.year].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n");
    blocks.push(section("Education", body));
  }

  const certs = parseLines(p.certs);
  if (certs.length) {
    blocks.push(section("Certifications", certs.map((c) => `- ${c}`).join("\n")));
  }

  // Normalise to ASCII-friendly punctuation for maximum ATS compatibility.
  return blocks
    .join("\n\n\n")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .trim();
}

/** Download a profile as an ATS-friendly .txt file. */
export function exportResumeTXT(p: Profile, name?: string) {
  const file = `${slugify(name || p.name || "resume")}.txt`;
  downloadText(file, buildResumeText(p));
}
