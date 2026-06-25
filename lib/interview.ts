// ============== MOCK INTERVIEW SIMULATOR ==============
// Turn-based AI interviewer. Generates tailored questions and scores answers
// with structured feedback. Runs client-side via the configured provider.

import type { ProviderSettings, InterviewFeedback } from "./types";
import { callAI } from "./ai";

export interface InterviewContext {
  role: string;
  company: string;
  jd?: string;
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function ctxBlock(ctx: InterviewContext): string {
  return `Target role: ${ctx.role || "a relevant professional role"}${
    ctx.company ? ` at ${ctx.company}` : ""
  }${
    ctx.jd
      ? `\n\nJob description:\n"""\n${ctx.jd.slice(0, 2500)}\n"""`
      : ""
  }`;
}

export async function nextQuestion(
  ctx: InterviewContext,
  asked: string[],
  providers: ProviderSettings,
): Promise<string> {
  const prompt = `You are a senior hiring manager conducting a job interview.
${ctxBlock(ctx)}

Ask ONE realistic interview question for this role. Mix behavioural and technical/role-specific questions across the interview. Keep it concise and natural — one question only.

Questions already asked (do NOT repeat or closely rephrase these):
${asked.length ? asked.map((q, i) => `${i + 1}. ${q}`).join("\n") : "(none yet)"}

Respond with valid JSON only:
{ "question": "the next interview question" }`;
  const r = (await callAI(prompt, providers)) as { question?: string };
  return String(r.question ?? "Tell me about yourself and why you're interested in this role.");
}

export async function scoreAnswer(
  ctx: InterviewContext,
  question: string,
  answer: string,
  providers: ProviderSettings,
): Promise<InterviewFeedback> {
  const prompt = `You are an expert interview coach evaluating a candidate's answer.
${ctxBlock(ctx)}

Interview question:
"""${question}"""

Candidate's answer:
"""${answer}"""

Evaluate the answer honestly. Score 0-100 on relevance, structure (e.g. STAR), specificity and impact. Then give concrete, actionable feedback and a strong model answer the candidate could adapt.

Respond with valid JSON only:
{
  "score": 0,
  "strengths": ["what worked, 1-3 points"],
  "improvements": ["specific fixes, 1-3 points"],
  "modelAnswer": "a concise, strong example answer"
}`;
  const r = (await callAI(prompt, providers)) as {
    score?: number;
    strengths?: unknown;
    improvements?: unknown;
    modelAnswer?: string;
  };
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    strengths: asArray(r.strengths),
    improvements: asArray(r.improvements),
    modelAnswer: String(r.modelAnswer ?? ""),
  };
}
