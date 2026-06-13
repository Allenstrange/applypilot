// ============== CV UPLOAD & PARSING ==============
// Ported from the legacy static app (js/parser.js). All heavy libraries are
// dynamically imported so they only load in the browser when a file is parsed.

import type { Profile, ProviderSettings } from "./types";
import { callAI } from "./ai";
import { emptyProfile } from "./store";

export type ApplyMode = "overwrite" | "merge";

/** Coerce arbitrary AI/JSON output into a well-formed Profile. */
export function normaliseJsonProfile(data: unknown): Profile {
  const d = (data ?? {}) as Record<string, unknown>;
  const asString = (v: unknown) => (typeof v === "string" ? v : "");
  const joinSkills = (s: unknown) =>
    Array.isArray(s) ? s.join(", ") : asString(s);
  const joinCerts = (c: unknown) =>
    Array.isArray(c) ? c.join("\n") : asString(c);

  const experience = Array.isArray(d.experience)
    ? d.experience.map((e: Record<string, unknown>) => ({
        company: asString(e.company),
        role: asString(e.role),
        start: asString(e.start),
        end: asString(e.end),
        bullets: Array.isArray(e.bullets)
          ? e.bullets.join("\n")
          : asString(e.bullets),
        tools: Array.isArray(e.tools) ? e.tools.join(", ") : asString(e.tools),
      }))
    : [];

  const education = Array.isArray(d.education)
    ? d.education.map((e: Record<string, unknown>) => ({
        institution: asString(e.institution),
        degree: asString(e.degree),
        year: asString(e.year),
      }))
    : [];

  return {
    name: asString(d.name),
    title: asString(d.title),
    email: asString(d.email),
    phone: asString(d.phone),
    location: asString(d.location),
    linkedin: asString(d.linkedin),
    summary: asString(d.summary),
    skills: joinSkills(d.skills),
    certs: joinCerts(d.certifications ?? d.certs),
    experience,
    education,
  };
}

async function readDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

async function readPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let pageText = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) pageText += "\n";
      else if (lastY !== null) pageText += " ";
      pageText += item.str;
      lastY = y;
    }
    fullText += pageText + "\n\n";
  }
  return fullText;
}

async function parseCVWithAI(
  text: string,
  providers: ProviderSettings,
): Promise<Profile> {
  const schema = {
    name: "string",
    title: "string",
    email: "string",
    phone: "string",
    location: "string",
    linkedin: "string",
    summary: "string",
    skills: "comma-separated string",
    certs: "newline-separated string",
    experience: [
      {
        company: "string",
        role: "string",
        start: "string",
        end: "string",
        bullets: "string with one bullet per line",
        tools: "comma-separated string",
      },
    ],
    education: [{ institution: "string", degree: "string", year: "string" }],
  };

  const prompt = `Extract structured data from this CV. Only output data EXPLICITLY present. Return JSON matching this schema: ${JSON.stringify(
    schema,
  )}

CV TEXT:
"""
${text}
"""`;

  const result = await callAI(prompt, providers);
  return normaliseJsonProfile(result);
}

export interface ParseResult {
  profile: Profile;
  /** Short human-readable note about which path was used / what was found. */
  source: "json" | "ai" | "local";
}

/**
 * Read a CV file and return a normalised Profile. Uses AI when configured,
 * otherwise falls back to a (currently minimal) local parser. JSON imports
 * bypass AI entirely.
 */
export async function parseCVFile(
  file: File,
  providers: ProviderSettings,
  aiConfigured: boolean,
): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "json") {
    const text = await file.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON format: " + (e as Error).message);
    }
    return { profile: normaliseJsonProfile(json), source: "json" };
  }

  let text = "";
  if (ext === "txt") text = await file.text();
  else if (ext === "docx") text = await readDocxText(file);
  else if (ext === "pdf") text = await readPdfText(file);
  else throw new Error("Unsupported file type: " + ext);

  if (aiConfigured) {
    return { profile: await parseCVWithAI(text, providers), source: "ai" };
  }
  // Local fallback: returns an empty shell (kept minimal, as in the legacy app).
  return { profile: { ...emptyProfile }, source: "local" };
}

/** Merge parsed data into an existing profile, filling only blank fields. */
export function mergeProfiles(current: Profile, parsed: Profile): Profile {
  const merged: Profile = { ...current };
  (
    [
      "name",
      "title",
      "email",
      "phone",
      "location",
      "linkedin",
      "summary",
      "skills",
      "certs",
    ] as const
  ).forEach((key) => {
    if (!merged[key] && parsed[key]) merged[key] = parsed[key];
  });
  if (merged.experience.length === 0 && parsed.experience.length > 0)
    merged.experience = parsed.experience;
  if (merged.education.length === 0 && parsed.education.length > 0)
    merged.education = parsed.education;
  return merged;
}
