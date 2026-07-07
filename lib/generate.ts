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
  NinetyDayPlan,
  AssistantMessage,
  ResumeEdit,
  ResumeEditKind,
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

// ============== CONVERSATIONAL RÉSUMÉ ASSISTANT ==============
// Single-turn, JSON-only (the constraint of lib/ai.ts): the whole chat history
// is folded into one prompt and the model returns { reply, edits[] }. Each edit
// is a structured, reviewable change the UI renders as an Apply/Dismiss card.

const VALID_EDIT_KINDS: ReadonlySet<ResumeEditKind> = new Set([
  "summary",
  "skills",
  "title",
  "bullet",
  "addBullet",
]);

/** Drop malformed edits and clamp indices so a bad payload can't corrupt the CV. */
function normaliseEdits(raw: unknown, draftCV: Profile): ResumeEdit[] {
  if (!Array.isArray(raw)) return [];
  const out: ResumeEdit[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const kind = String(e.kind ?? "") as ResumeEditKind;
    if (!VALID_EDIT_KINDS.has(kind)) continue;
    const value = typeof e.value === "string" ? e.value.trim() : "";
    if (!value) continue;

    const edit: ResumeEdit = {
      id: crypto.randomUUID(),
      kind,
      value,
      rationale: typeof e.rationale === "string" ? e.rationale.trim() : "",
    };

    if (kind === "bullet" || kind === "addBullet") {
      const expIndex = Number(e.expIndex);
      if (!Number.isInteger(expIndex) || expIndex < 0 || expIndex >= draftCV.experience.length) {
        continue; // can't target a role that doesn't exist
      }
      edit.expIndex = expIndex;
      if (kind === "bullet") {
        const lines = (draftCV.experience[expIndex].bullets || "").split("\n");
        const bulletIndex = Number(e.bulletIndex);
        if (!Number.isInteger(bulletIndex) || bulletIndex < 0 || bulletIndex >= lines.length) {
          continue;
        }
        edit.bulletIndex = bulletIndex;
        edit.before = lines[bulletIndex];
      } else {
        edit.before = "";
      }
    } else if (kind === "summary") {
      edit.before = draftCV.summary;
    } else if (kind === "skills") {
      edit.before = draftCV.skills;
    } else if (kind === "title") {
      edit.before = draftCV.title;
    }

    out.push(edit);
  }
  return out.slice(0, 8);
}

/** A compact, index-annotated view of the CV so the model can target edits. */
function cvForPrompt(p: Profile): string {
  const exp = p.experience.map((e, i) => ({
    expIndex: i,
    role: e.role,
    company: e.company,
    bullets: (e.bullets || "").split("\n").map((b, j) => ({ bulletIndex: j, text: b })),
  }));
  return JSON.stringify(
    { title: p.title, summary: p.summary, skills: p.skills, experience: exp },
    null,
    2,
  );
}

/**
 * Conversational résumé co-pilot. Given the chat `history` and the latest user
 * message (last entry of `history`), returns a short `reply` plus zero or more
 * concrete, reviewable `edits` to the draft CV. `analysis` is optional — when
 * present, the target job's keywords steer the suggestions.
 */
export async function assistantEditResume(
  history: AssistantMessage[],
  draftCV: Profile,
  analysis: Analysis | null,
  providers: ProviderSettings,
): Promise<{ reply: string; edits: ResumeEdit[] }> {
  const transcript = history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const jobContext = analysis
    ? `Target job: ${analysis.title} at ${analysis.company}.
Job description keywords to prioritise: ${(analysis.jdKeywords || []).join(", ") || "(none)"}
`
    : `No specific target job is set — improve the résumé for general strength and ATS-readiness.\n`;

  const prompt = `You are an expert résumé writing assistant embedded in a CV editor. You help the user improve their résumé through conversation. You can both REPLY in plain language and PROPOSE concrete edits to specific fields, which the user reviews and Applies or Dismisses.

${jobContext}
Current résumé (each experience entry has an expIndex; each bullet has a bulletIndex — you MUST use these exact indices to target edits):
"""
${cvForPrompt(draftCV)}
"""

Conversation so far:
"""
${transcript}
"""

Now respond to the user's latest message.

Rules:
- Be truthful: never invent employers, dates, degrees or specific metrics. You MAY add placeholder metrics like [X%] or [N users] when quantifying.
- Keep "reply" short and conversational (1-3 sentences). Summarise what you changed or ask a clarifying question.
- Propose an edit ONLY when it concretely improves a field. If the user is just chatting or asking a question, return an empty "edits" array and answer in "reply".
- Each edit targets exactly one field via "kind": "summary" | "skills" | "title" | "bullet" | "addBullet".
  - For "bullet" and "addBullet" you MUST include "expIndex"; for "bullet" you MUST also include "bulletIndex".
  - "value" is the full replacement text for that field/bullet (for "skills", a single comma-separated line).
  - "rationale" is a one-line why (≤12 words).
- Prefer a few high-impact edits over many trivial ones (max 8).
- Respond with valid JSON only. No prose, no markdown.

JSON schema:
{
  "reply": "short conversational reply",
  "edits": [
    { "kind": "summary", "value": "new summary text", "rationale": "why" },
    { "kind": "bullet", "expIndex": 0, "bulletIndex": 1, "value": "rewritten bullet", "rationale": "why" }
  ]
}`;

  const r = (await callAI(prompt, providers)) as { reply?: unknown; edits?: unknown };
  return {
    reply:
      typeof r.reply === "string" && r.reply.trim()
        ? r.reply.trim()
        : "Here are a few suggestions.",
    edits: normaliseEdits(r.edits, draftCV),
  };
}

export async function generateCoverLetter(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
  tone: string = "Professional",
): Promise<CoverLetter> {
  const prompt = `You are an expert career coach writing a highly tailored, persuasive cover letter.
${context(profile, analysis)}

Write a ${tone.toLowerCase()}, ${tone.toLowerCase() === "concise" ? "tight 2-3" : "compelling 3-4"} paragraph cover letter in a distinctly ${tone} tone. Frame any gaps positively without stating the candidate lacks a skill.
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

export async function generateNinetyDayPlan(
  profile: Profile,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<NinetyDayPlan> {
  const prompt = `You are helping a candidate prepare a 30-60-90 day plan to present in a final-round interview for this role. Ground every action in the job description's actual responsibilities and the candidate's real experience — no generic filler.
${context(profile, analysis)}

${KEYWORD_RULE}

JSON schema:
{
  "phases": [
    {"title": "First 30 days", "focus": "one-line theme (learn)", "actions": ["4-5 concrete, role-specific actions"]},
    {"title": "Days 31-60", "focus": "one-line theme (contribute)", "actions": ["4-5 concrete, role-specific actions"]},
    {"title": "Days 61-90", "focus": "one-line theme (own)", "actions": ["4-5 concrete, role-specific actions"]}
  ],
  "keywords": ["..."]
}`;
  const r = (await callAI(prompt, providers)) as { phases?: unknown; keywords?: unknown };
  const phases = Array.isArray(r.phases)
    ? r.phases.map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        return {
          title: String(o.title ?? ""),
          focus: String(o.focus ?? ""),
          actions: asArray(o.actions),
        };
      })
    : [];
  return { phases, keywords: asArray(r.keywords) };
}

export type BulletMode = "star" | "professional" | "metrics" | "xyz";

const BULLET_INSTRUCTIONS: Record<BulletMode, string> = {
  star: "Rewrite this CV bullet point in STAR format (Situation, Task, Action, Result). Keep it truthful and concise.",
  professional:
    "Make this CV bullet point more professional and impactful. Use strong action verbs.",
  metrics:
    "Add realistic metric placeholders to this CV bullet point (e.g., [X%], [Y users]).",
  xyz: 'Rewrite this CV bullet point using the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]". Keep it truthful; use metric placeholders like [X%] where the original has no numbers.',
};

export async function enhanceBullet(
  bullet: string,
  mode: BulletMode,
  providers: ProviderSettings,
): Promise<string> {
  const prompt = `${BULLET_INSTRUCTIONS[mode]} Return JSON: {"enhanced": "rewritten bullet"}

Original: "${bullet}"`;
  const r = (await callAI(prompt, providers)) as { enhanced?: string };
  return r.enhanced ?? bullet;
}

/** Produce THREE distinct rewrite options for a single CV bullet. */
export async function enhanceBulletVariants(
  bullet: string,
  mode: BulletMode,
  providers: ProviderSettings,
): Promise<string[]> {
  const instructions = BULLET_INSTRUCTIONS;
  const prompt = `${instructions[mode]} Produce THREE meaningfully different options the candidate can choose from. Keep each truthful and concise (one line each). Return valid JSON only: {"options": ["option 1", "option 2", "option 3"]}

Original: "${bullet}"`;
  const r = (await callAI(prompt, providers)) as { options?: unknown };
  const opts = asArray(r.options).map((s) => s.trim()).filter(Boolean);
  return opts.length ? opts.slice(0, 3) : [bullet];
}

/** Produce THREE rewrite options for the summary or skills section. */
export async function enhanceTextVariants(
  text: string,
  kind: "summary" | "skills",
  providers: ProviderSettings,
): Promise<string[]> {
  const instr =
    kind === "summary"
      ? "Rewrite this professional summary to be punchy, specific and ATS-friendly. Keep it truthful — 2 to 4 sentences."
      : "Improve and reprioritise this comma-separated skills list. Keep it truthful, surface industry-standard skill phrases, and return a single comma-separated line per option.";
  const prompt = `${instr} Produce THREE meaningfully different options. Return valid JSON only: {"options": ["option 1", "option 2", "option 3"]}

Current ${kind}: "${text}"`;
  const r = (await callAI(prompt, providers)) as { options?: unknown };
  const opts = asArray(r.options).map((s) => s.trim()).filter(Boolean);
  return opts.length ? opts.slice(0, 3) : [text];
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

/**
 * Generate ONE new résumé bullet for a specific role that naturally demonstrates
 * a target JD keyword. Powers the guided "Keyword Targeting" queue. Returns the
 * bullet text (no leading bullet character).
 */
export async function generateKeywordBullet(
  profile: Profile,
  expIndex: number,
  keyword: string,
  analysis: Analysis,
  providers: ProviderSettings,
): Promise<string> {
  const role = profile.experience[expIndex];
  const roleCtx = {
    role: role?.role ?? "",
    company: role?.company ?? "",
    existingBullets: (role?.bullets ?? "").split("\n").map((b) => b.trim()).filter(Boolean),
  };
  const prompt = `You are an expert résumé writer. Write ONE new bullet point for the role below that naturally demonstrates the skill/keyword "${keyword}", tailored to the target job.

Target job: ${analysis.title} at ${analysis.company}.

Role:
"""
${JSON.stringify(roleCtx, null, 2)}
"""

Rules:
- Truthful and realistic for THIS role — never fabricate employers, dates, or specific hard numbers. You MAY include a placeholder metric like [X%] or [N people] when quantifying.
- Begin with a strong action verb; keep it to one line (~20-30 words); no leading bullet character.
- The bullet MUST genuinely incorporate "${keyword}" (the exact term or an unmistakable form of it).
- Do not duplicate an existing bullet.
- Respond with valid JSON only: {"bullet": "the new bullet text"}`;
  const r = (await callAI(prompt, providers)) as { bullet?: unknown };
  return typeof r.bullet === "string" ? r.bullet.trim().replace(/^\s*[-•]\s*/, "") : "";
}
