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
