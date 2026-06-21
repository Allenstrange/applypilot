// ============== GENERATION PIPELINES ==============
// Four AI generation modes. Every mode injects 4-10 JD keywords throughout the
// content and returns them as `keywords[]` alongside its structured payload.

import type {
  Profile,
  Analysis,
  ProviderSettings,
  CoverLetter,
  ResumeSummary,
  InterviewPrep,
  Outreach,
} from "./types";
import { callAI } from "./ai";

const KEYWORD_RULE = `Identify 4-10 prominent, industry-standard skill phrases from the job description (e.g. "Kubernetes", "CI/CD", "Stakeholder Management"). Weave them naturally throughout the generated content and also return them in a "keywords" string array. Respond with valid JSON only — no prose, no markdown.`;

function context(profile: Profile, analysis: Analysis): string {
  return `Job title: ${analysis.title}
Company: ${analysis.company}

Job description:
"""
${analysis.jd}
"""

Candidate profile:
"""
${JSON.stringify(profile, null, 2)}
"""`;
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

export async function generateCoverLetter(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<CoverLetter> {
  const prompt = `You are an expert career coach writing a highly tailored, persuasive cover letter.
${context(profile, analysis)}

Write a confident, professional 3-4 paragraph cover letter. Frame any gaps positively without stating the candidate lacks a skill.
${KEYWORD_RULE}

JSON schema:
{
  "subjectLine": "dynamic, modern subject line",
  "salutation": "company/department-specific greeting",
  "body": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "closing": "high-enthusiasm closing paragraph",
  "signOff": "professional sign-off block",
  "keywords": ["..."]
}`;
  const r = (await callAI(prompt, providers)) as Record<string, unknown>;
  return {
    subjectLine: String(r.subjectLine ?? ""),
    salutation: String(r.salutation ?? ""),
    body: asArray(r.body),
    closing: String(r.closing ?? ""),
    signOff: String(r.signOff ?? ""),
    keywords: asArray(r.keywords),
  };
}

export async function generateResumeSummary(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<ResumeSummary> {
  const prompt = `You are a resume expert refining the top section of a CV for maximum recruiter impact.
${context(profile, analysis)}

${KEYWORD_RULE}

JSON schema:
{
  "targetHeadline": "bold, high-level role summary",
  "introSummary": "dense, punchy paragraph synthesizing the candidate's skills with the job's needs",
  "bulletPoints": ["3-5 action-oriented bullets with concrete metrics drawn from the candidate profile"],
  "keywords": ["..."]
}`;
  const r = (await callAI(prompt, providers)) as Record<string, unknown>;
  return {
    targetHeadline: String(r.targetHeadline ?? ""),
    introSummary: String(r.introSummary ?? ""),
    bulletPoints: asArray(r.bulletPoints),
    keywords: asArray(r.keywords),
  };
}

export async function generateInterviewPrep(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<InterviewPrep> {
  const prompt = `You are an interview preparation coach. Convert the job description and candidate background into private coaching materials.
${context(profile, analysis)}

${KEYWORD_RULE}

JSON schema:
{
  "questions": ["tailored technical and behavioral interview questions"],
  "answerFormulas": ["template guidelines for framing answers using the candidate's actual history — one per question"],
  "coachTips": ["behind-the-scenes pointers on what hiring teams look for — one per question"],
  "keywords": ["..."]
}`;
  const r = (await callAI(prompt, providers)) as Record<string, unknown>;
  return {
    questions: asArray(r.questions),
    answerFormulas: asArray(r.answerFormulas),
    coachTips: asArray(r.coachTips),
    keywords: asArray(r.keywords),
  };
}

export async function generateOutreach(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<Outreach> {
  const prompt = `You are writing a concise, warm outreach message to a recruiter or hiring manager about a role the candidate is applying for.
${context(profile, analysis)}

Keep it under 150 words, specific, and confident — not generic. Reference one concrete point of alignment.
${KEYWORD_RULE}

JSON schema:
{
  "subject": "short outreach subject line",
  "message": "the outreach message body with line breaks",
  "keywords": ["..."]
}`;
  const r = (await callAI(prompt, providers)) as Record<string, unknown>;
  return {
    subject: String(r.subject ?? ""),
    message: String(r.message ?? ""),
    keywords: asArray(r.keywords),
  };
}

export async function enhanceBullet(
  bullet: string,
  mode: "star" | "professional" | "metrics",
  providers: ProviderSettings,
): Promise<string> {
  const instructions: Record<typeof mode, string> = {
    star: "Rewrite this CV bullet point in STAR format (Situation, Task, Action, Result). Keep it truthful and concise.",
    professional:
      "Make this CV bullet point more professional and impactful. Use strong action verbs.",
    metrics:
      "Add realistic metric placeholders to this CV bullet point (e.g., [X%], [Y users]).",
  };
  const prompt = `${instructions[mode]} Return JSON: {"enhanced": "rewritten bullet"}

Original: "${bullet}"`;
  const r = (await callAI(prompt, providers)) as { enhanced?: string };
  return r.enhanced ?? bullet;
}

/**
 * One-click ATS optimisation: rewrites summary, skills and every experience
 * bullet to align with the job — without inventing roles, companies or dates.
 */
export async function optimizeResumeForJob(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<Profile> {
  const prompt = `You are an ATS optimisation expert. Rewrite the candidate's resume CONTENT to maximise alignment with the target job, WITHOUT inventing experience, employers, dates or qualifications.

Rules:
- Keep the SAME companies, roles, dates and education entirely unchanged.
- Rewrite the professional summary to be punchy and tailored to this job.
- Reorder/expand the skills list to surface the job's key skills the candidate genuinely has.
- Rewrite each role's bullets using strong action verbs, JD keywords and quantified impact. If a bullet has no metric, you MAY add a realistic placeholder like [X%] or [N users] — never fabricate specific numbers.
- Return EXACTLY the same number of experience entries, in the same order.
- Respond with valid JSON only. No prose, no markdown.

${context(profile, analysis)}

JSON schema:
{
  "summary": "rewritten professional summary",
  "skills": "comma-separated, prioritised skills",
  "certs": "newline-separated certifications (keep existing, do not invent)",
  "experience": [
    { "bullets": "newline-separated rewritten bullets for role 1" }
  ]
}`;
  const r = (await callAI(prompt, providers)) as {
    summary?: string;
    skills?: string;
    certs?: string;
    experience?: { bullets?: string }[];
  };
  return {
    ...profile,
    summary: String(r.summary ?? profile.summary),
    skills: String(r.skills ?? profile.skills),
    certs: String(r.certs ?? profile.certs),
    experience: profile.experience.map((e, i) => ({
      ...e,
      bullets: String(r.experience?.[i]?.bullets ?? e.bullets),
    })),
  };
}
