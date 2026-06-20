import type { AIConfig } from './types'

const AI_CONFIG_KEY = 'applypilot_ai_config'

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
}

export function isAIConfigured(): boolean {
  const c = getAIConfig()
  return !!(c?.apiKey && c?.provider)
}

const ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  grok: 'https://api.x.ai/v1/chat/completions',
}

export async function callAI(prompt: string, systemPrompt = 'You are a helpful job application assistant.'): Promise<string> {
  const config = getAIConfig()
  if (!config?.apiKey) throw new Error('AI not configured. Add your API key in Settings.')

  const endpoint = config.provider === 'custom' ? (config.endpoint ?? '') : ENDPOINTS[config.provider]
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  let body: unknown
  if (config.provider === 'anthropic') {
    headers['x-api-key'] = config.apiKey
    headers['anthropic-version'] = '2023-06-01'
    body = { model: config.model, max_tokens: 2048, system: systemPrompt, messages: [{ role: 'user', content: prompt }] }
  } else {
    headers['Authorization'] = `Bearer ${config.apiKey}`
    body = { model: config.model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] }
  }

  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`AI error (${res.status}): ${err}`)
  }
  const data = await res.json()
  if (config.provider === 'anthropic') return data.content?.[0]?.text ?? ''
  return data.choices?.[0]?.message?.content ?? ''
}

export async function testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
  const start = Date.now()
  try {
    await callAI('Reply with exactly: OK')
    return { success: true, latency: Date.now() - start }
  } catch (e) {
    return { success: false, latency: Date.now() - start, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export const MODEL_OPTIONS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
  grok: ['grok-beta', 'grok-vision-beta'],
  custom: ['custom'],
}

// ---------------------------------------------------------------------------
// Higher-level AI helpers used across features (cover letter lives in its page)
// ---------------------------------------------------------------------------

/** Pull a JSON object out of an AI response that may include prose or code fences. */
export function parseJSONFromAI<T = unknown>(raw: string): T {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first >= 0 && last > first) s = s.slice(first, last + 1)
  return JSON.parse(s) as T
}

function cleanLine(s: string): string {
  return s.trim().replace(/^["'`•\-\s]+/, '').replace(/["'`]+$/, '').trim()
}

/** Rewrite a single resume bullet to be stronger and more quantified. */
export async function aiRewriteBullet(bullet: string, role?: string): Promise<string> {
  const prompt = `Rewrite this resume bullet to be stronger and more impactful${role ? ` for a ${role} role` : ''}. Start with a strong action verb, quantify impact where reasonable, keep it to one concise line. Return ONLY the rewritten bullet — no quotes, no preamble, no bullet symbol.\n\nBullet: ${bullet}`
  return cleanLine(await callAI(prompt, 'You are an expert resume writer.'))
}

/** Generate a 2–3 sentence professional summary from profile signals. */
export async function aiWriteSummary(input: { role?: string; skills: string[]; experience: { title: string; company: string }[] }): Promise<string> {
  const exp = input.experience.slice(0, 3).map(e => `${e.title} at ${e.company}`).join('; ')
  const prompt = `Write a concise, confident professional summary (2–3 sentences, first person implied, no name) for a resume.\nTarget role: ${input.role || 'general'}\nKey skills: ${input.skills.slice(0, 10).join(', ') || 'n/a'}\nRecent roles: ${exp || 'n/a'}\nReturn ONLY the summary text.`
  return (await callAI(prompt, 'You are an expert resume writer.')).trim()
}

/** Suggest concrete edits to raise an ATS match, given the missing keywords. */
export async function aiAtsSuggestions(jobTitle: string, missing: string[], resumeText: string): Promise<string> {
  const prompt = `A candidate's resume scored low against a "${jobTitle || 'role'}" job description. These important keywords are missing or weak: ${missing.join(', ') || 'none'}.\n\nResume content:\n"""${resumeText.slice(0, 3000)}"""\n\nGive 4–6 short, specific, actionable suggestions to raise the ATS match honestly (only suggest adding skills/keywords the candidate could plausibly have). Format as a plain markdown bullet list, no preamble.`
  return (await callAI(prompt, 'You are an ATS optimization expert.')).trim()
}

export interface ExtractedProfile {
  name?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string
  summary?: string; skills?: string[]; certifications?: string[]
  experience?: { company?: string; title?: string; location?: string; startDate?: string; endDate?: string; current?: boolean; bullets?: string[] }[]
  education?: { school?: string; degree?: string; field?: string; startDate?: string; endDate?: string }[]
}

/** Parse raw resume text into a structured profile via the configured AI provider. */
export async function aiExtractProfile(text: string): Promise<ExtractedProfile> {
  const prompt = `Extract the resume below into JSON with EXACTLY this shape:
{"name":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":"","skills":[],"certifications":[],"experience":[{"company":"","title":"","location":"","startDate":"","endDate":"","current":false,"bullets":[]}],"education":[{"school":"","degree":"","field":"","startDate":"","endDate":""}]}
Use empty strings/arrays for anything not present. Dates like "Jan 2022". Keep bullets concise. Return ONLY valid JSON — no markdown, no commentary.\n\nRESUME:\n"""${text.slice(0, 8000)}"""`
  const out = await callAI(prompt, 'You extract structured data from resumes and reply with JSON only.')
  return parseJSONFromAI<ExtractedProfile>(out)
}
