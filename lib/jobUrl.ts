// ============== JOB URL IMPORT ==============
// Client-only: fetches a job posting's readable text via the r.jina.ai reader
// proxy (CORS-friendly), then optionally extracts company/title/location via AI.

import type { ProviderSettings } from "./types";
import { callAI } from "./ai";

export async function fetchJobText(url: string): Promise<string> {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const resp = await fetch("https://r.jina.ai/" + u);
  if (!resp.ok) throw new Error("Could not fetch the page (status " + resp.status + ")");
  const text = await resp.text();
  if (!text || text.trim().length < 40) throw new Error("No readable content found at that URL");
  return text;
}

export interface JobMeta {
  company: string;
  title: string;
  location: string;
}

export async function extractJobMeta(text: string, providers: ProviderSettings): Promise<JobMeta> {
  const prompt = `From this job posting text, extract the hiring company, the job title and the location.
Respond with valid JSON only: {"company":"","title":"","location":""}

"""
${text.slice(0, 6000)}
"""`;
  const r = (await callAI(prompt, providers)) as Partial<JobMeta>;
  return {
    company: String(r.company ?? "").trim(),
    title: String(r.title ?? "").trim(),
    location: String(r.location ?? "").trim(),
  };
}
