// ============== MULTI-PROVIDER AI CLIENT ==============
// Ported from the legacy static app (js/ai.js). Calls run client-side so the
// user can switch providers/models freely; keys live in localStorage.

import type { ProviderId, ProviderConfig, ProviderSettings } from "./types";

export interface ModelOption {
  value: string;
  label: string;
  badge?: string;
}

export interface ModelGroup {
  label: string;
  models: ModelOption[];
}

export interface ProviderDef {
  name: string;
  description: string;
  icon: string;
  blurb: string;
  /** Where to get an API key for this provider. Empty for none. */
  keyUrl: string;
  modelGroups: ModelGroup[];
  /** Hint shown when a provider uses a free-text model field (no modelGroups). */
  modelPlaceholder?: string;
  /** Provider offers a genuine no-cost tier — shown as a "Free" badge. */
  free?: boolean;
  call: (
    prompt: string,
    model: string,
    apiKey: string,
    endpoint?: string,
  ) => Promise<unknown>;
}

/** Parse a model's text output as JSON, tolerating prose/code-fence wrappers. */
function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("No JSON found in model response");
  }
}

/**
 * Shared caller for OpenAI-compatible chat-completions endpoints (OpenRouter,
 * Groq, opencode zen, …). Avoids forcing response_format since many free/open
 * models reject it; relies on the prompt + loose JSON parsing instead.
 */
async function openaiCompatibleCall(
  endpoint: string,
  prompt: string,
  model: string,
  apiKey: string,
  label: string,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`${label} error: ${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error(`${label}: malformed response`);
  return parseJsonLoose(content);
}

export const AI_PROVIDERS: Record<ProviderId, ProviderDef> = {
  openai: {
    name: "OpenAI",
    description: "GPT-5.5, GPT-5.4, GPT-5.1",
    icon: "🤖",
    blurb: "Latest GPT-5.5 family. Best all-round accuracy.",
    keyUrl: "https://platform.openai.com/api-keys",
    modelGroups: [
      {
        label: "🚀 GPT-5.5 (Latest)",
        models: [
          { value: "gpt-5.5", label: "GPT-5.5 — Most capable", badge: "new" },
          { value: "gpt-5.5-pro", label: "GPT-5.5 Pro — Deep reasoning", badge: "reasoning" },
        ],
      },
      {
        label: "⚡ GPT-5.4",
        models: [
          { value: "gpt-5.4-mini", label: "GPT-5.4 Mini — Best balance", badge: "recommended" },
          { value: "gpt-5.4-nano", label: "GPT-5.4 Nano — Cheapest" },
        ],
      },
      {
        label: "🔹 Earlier GPT-5",
        models: [
          { value: "gpt-5.2", label: "GPT-5.2" },
          { value: "gpt-5.1", label: "GPT-5.1" },
        ],
      },
    ],
    async call(prompt, model, apiKey) {
      // GPT-5 and o-series reasoning models reject a custom temperature.
      const isReasoning =
        model.startsWith("o3") || model.startsWith("o4") || model.startsWith("gpt-5");
      const body: Record<string, unknown> = {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      };
      if (!isReasoning) body.temperature = 0.1;
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("OpenAI error: " + resp.status);
      const data = await resp.json();
      return JSON.parse(data.choices[0].message.content);
    },
  },

  anthropic: {
    name: "Anthropic Claude",
    description: "Claude Opus 4.8, Sonnet 4.6, Haiku 4.5",
    icon: "🧠",
    blurb: "Latest Claude 4.x models. Excellent structured extraction.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    modelGroups: [
      {
        label: "🚀 Most capable",
        models: [
          { value: "claude-opus-4-8", label: "Claude Opus 4.8", badge: "new" },
        ],
      },
      {
        label: "⚡ Balanced",
        models: [
          { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", badge: "recommended" },
        ],
      },
      {
        label: "🔹 Fast & cheap",
        models: [{ value: "claude-haiku-4-5", label: "Claude Haiku 4.5" }],
      },
      {
        label: "🔸 Previous generation",
        models: [{ value: "claude-opus-4-7", label: "Claude Opus 4.7" }],
      },
    ],
    async call(prompt, model, apiKey) {
      // Opus 4.7/4.8 and Fable 5 reject sampling parameters (temperature → 400).
      const noTemp = /opus-4-(7|8)|fable/.test(model);
      const body: Record<string, unknown> = {
        model,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      };
      if (!noTemp) body.temperature = 0.1;
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("Anthropic error: " + resp.status);
      const data = await resp.json();
      const textBlock = (data.content as { type: string; text?: string }[]).find(
        (b) => b.type === "text",
      );
      const text = (textBlock?.text ?? data.content[0].text) as string;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      return JSON.parse(jsonMatch[0]);
    },
  },

  gemini: {
    name: "Google Gemini",
    description: "Gemini 3.5 Flash, 3.1 Pro",
    icon: "💎",
    blurb: "Latest Gemini 3.x. Fast with a generous free tier.",
    keyUrl: "https://aistudio.google.com/apikey",
    free: true,
    modelGroups: [
      {
        label: "🚀 Gemini 3.5 (Latest)",
        models: [
          { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", badge: "recommended" },
        ],
      },
      {
        label: "🧠 Gemini 3.1 Pro",
        models: [
          { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", badge: "new" },
        ],
      },
      {
        label: "⚡ Fast & cheap",
        models: [
          { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
          { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
        ],
      },
    ],
    async call(prompt, model, apiKey) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        },
      );
      if (!resp.ok) throw new Error("Gemini error: " + resp.status);
      const data = await resp.json();
      const text = data.candidates[0].content.parts[0].text as string;
      return JSON.parse(text);
    },
  },

  grok: {
    name: "xAI Grok",
    description: "Grok 4.3",
    icon: "✴️",
    blurb: "xAI's Grok 4.3 — strong reasoning, OpenAI-compatible API.",
    keyUrl: "https://console.x.ai",
    modelGroups: [
      {
        label: "🚀 Grok 4.3 (Latest)",
        models: [{ value: "grok-4.3", label: "Grok 4.3 — Most capable", badge: "recommended" }],
      },
      {
        label: "💻 Coding",
        models: [{ value: "grok-build-0.1", label: "Grok Build (early access)", badge: "new" }],
      },
    ],
    async call(prompt, model, apiKey) {
      const resp = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });
      if (!resp.ok) throw new Error("Grok error: " + resp.status);
      const data = await resp.json();
      return JSON.parse(data.choices[0].message.content);
    },
  },

  groq: {
    name: "Groq",
    description: "Free · Llama, GPT-OSS (ultra-fast)",
    icon: "⚡",
    blurb: "Free, very fast inference for open models. Note: this is Groq — not xAI Grok above.",
    keyUrl: "https://console.groq.com/keys",
    free: true,
    modelGroups: [],
    modelPlaceholder: "e.g. llama-3.3-70b-versatile or llama-3.1-8b-instant",
    async call(prompt, model, apiKey) {
      return openaiCompatibleCall(
        "https://api.groq.com/openai/v1/chat/completions",
        prompt,
        model,
        apiKey,
        "Groq",
      );
    },
  },

  openrouter: {
    name: "OpenRouter",
    description: "Free & paid · DeepSeek, Llama, Qwen…",
    icon: "🔀",
    blurb: "One key, hundreds of models — including many free \":free\" variants. Browser-friendly.",
    keyUrl: "https://openrouter.ai/keys",
    free: true,
    modelGroups: [],
    modelPlaceholder: "e.g. deepseek/deepseek-r1:free or meta-llama/llama-3.3-70b-instruct:free",
    async call(prompt, model, apiKey) {
      return openaiCompatibleCall(
        "https://openrouter.ai/api/v1/chat/completions",
        prompt,
        model,
        apiKey,
        "OpenRouter",
        { "X-Title": "ApplyPilot" },
      );
    },
  },

  opencode: {
    name: "opencode zen",
    description: "OpenAI-compatible model gateway",
    icon: "🧩",
    blurb: "The opencode project's model gateway. Enter any model id it serves.",
    keyUrl: "https://opencode.ai",
    modelGroups: [],
    modelPlaceholder: "a model id served by opencode zen",
    async call(prompt, model, apiKey) {
      return openaiCompatibleCall(
        "https://opencode.ai/zen/v1/chat/completions",
        prompt,
        model,
        apiKey,
        "opencode zen",
      );
    },
  },

  custom: {
    name: "Custom Endpoint",
    description: "Local LLM, Azure, etc.",
    icon: "🔧",
    blurb: "Connect to any OpenAI-compatible API (Ollama, LM Studio, etc.)",
    keyUrl: "",
    modelGroups: [],
    async call(prompt, model, apiKey, endpoint) {
      const resp = await fetch(endpoint as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey ? "Bearer " + apiKey : "",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });
      if (!resp.ok) throw new Error("Custom API error: " + resp.status);
      const data = await resp.json();
      return JSON.parse(data.choices[0].message.content);
    },
  },
};

export function isAIConfigured(settings: ProviderSettings): boolean {
  const provider = settings.activeProvider;
  const config = settings[provider];
  return !!(config.apiKey || (provider === "custom" && config.endpoint));
}

export async function callAI(
  prompt: string,
  settings: ProviderSettings,
): Promise<unknown> {
  const provider = settings.activeProvider;
  const config: ProviderConfig = settings[provider];
  if (!config.apiKey && provider !== "custom") {
    throw new Error("No API key configured for " + AI_PROVIDERS[provider].name);
  }
  if (provider === "custom" && !config.endpoint) {
    throw new Error("No endpoint configured");
  }
  if (provider === "custom") {
    return AI_PROVIDERS.custom.call(prompt, config.model, config.apiKey, config.endpoint);
  }
  return AI_PROVIDERS[provider].call(prompt, config.model, config.apiKey);
}
