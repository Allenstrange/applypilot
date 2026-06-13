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
  modelGroups: ModelGroup[];
  call: (
    prompt: string,
    model: string,
    apiKey: string,
    endpoint?: string,
  ) => Promise<unknown>;
}

export const AI_PROVIDERS: Record<ProviderId, ProviderDef> = {
  openai: {
    name: "OpenAI",
    description: "GPT-5, GPT-4.1, o3",
    icon: "🤖",
    blurb: "Latest GPT-5 and reasoning models. Best all-round accuracy.",
    modelGroups: [
      {
        label: "🚀 GPT-5 Family (Latest)",
        models: [
          { value: "gpt-5", label: "GPT-5 — Most capable", badge: "new" },
          { value: "gpt-5-mini", label: "GPT-5 Mini — Best balance", badge: "recommended" },
        ],
      },
      {
        label: "🧠 Reasoning Models",
        models: [
          { value: "o3", label: "o3 — Advanced reasoning", badge: "reasoning" },
          { value: "o4-mini", label: "o4 Mini — Latest reasoning", badge: "new" },
        ],
      },
      {
        label: "⚡ GPT-4.1 Family",
        models: [
          { value: "gpt-4.1", label: "GPT-4.1" },
          { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
        ],
      },
      {
        label: "🔹 GPT-4o Family",
        models: [
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gpt-4o-mini", label: "GPT-4o Mini" },
        ],
      },
    ],
    async call(prompt, model, apiKey) {
      const isReasoning = model.startsWith("o3") || model.startsWith("o4");
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
    description: "Claude 4.5, 4, 3.5",
    icon: "🧠",
    blurb: "Latest Claude 4.5 Sonnet. Excellent structured extraction.",
    modelGroups: [
      {
        label: "🚀 Claude 4.5 (Latest)",
        models: [
          { value: "claude-sonnet-4-5", label: "Claude 4.5 Sonnet", badge: "recommended" },
        ],
      },
      {
        label: "🔸 Claude 4",
        models: [{ value: "claude-sonnet-4", label: "Claude 4 Sonnet" }],
      },
      {
        label: "⚡ Claude 3.5",
        models: [
          { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
          { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
        ],
      },
    ],
    async call(prompt, model, apiKey) {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          temperature: 0.1,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) throw new Error("Anthropic error: " + resp.status);
      const data = await resp.json();
      const text = data.content[0].text as string;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      return JSON.parse(jsonMatch[0]);
    },
  },

  gemini: {
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Flash",
    icon: "💎",
    blurb: "Latest Gemini 2.5. Fast with a generous free tier.",
    modelGroups: [
      {
        label: "🚀 Gemini 2.5 (Latest)",
        models: [
          { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "recommended" },
          { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "new" },
        ],
      },
      {
        label: "🔹 Gemini 1.5",
        models: [
          { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
          { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
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
    description: "Grok 4, Grok 3",
    icon: "✴️",
    blurb: "xAI's Grok models — strong reasoning, OpenAI-compatible API.",
    modelGroups: [
      {
        label: "🚀 Grok 4 (Latest)",
        models: [{ value: "grok-4", label: "Grok 4 — Most capable", badge: "recommended" }],
      },
      {
        label: "⚡ Grok 3",
        models: [
          { value: "grok-3", label: "Grok 3" },
          { value: "grok-3-mini", label: "Grok 3 Mini", badge: "new" },
        ],
      },
      {
        label: "🔹 Grok 2",
        models: [{ value: "grok-2-1212", label: "Grok 2" }],
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

  custom: {
    name: "Custom Endpoint",
    description: "Local LLM, Azure, etc.",
    icon: "🔧",
    blurb: "Connect to any OpenAI-compatible API (Ollama, LM Studio, etc.)",
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
