"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { AI_PROVIDERS, callAI, isAIConfigured } from "@/lib/ai";
import type { ProviderId } from "@/lib/types";
import { toast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";

const PROVIDER_ORDER: ProviderId[] = ["openai", "anthropic", "gemini", "grok", "custom"];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const providers = useStore((s) => s.providers);
  const setActiveProvider = useStore((s) => s.setActiveProvider);
  const updateProviderConfig = useStore((s) => s.updateProviderConfig);
  const [testing, setTesting] = useState(false);

  if (!hydrated) {
    return (
      <div className="p-8">
        <PageHeader title="⚙ AI Provider Settings" subtitle="Loading…" />
      </div>
    );
  }

  const active = providers.activeProvider;
  const config = providers[active];
  const info = AI_PROVIDERS[active];

  async function testConnection() {
    setTesting(true);
    toast("⏳ Testing connection…");
    try {
      await callAI('Reply with {"status": "ok"}', providers);
      toast("✓ Connection successful");
    } catch (err) {
      toast("✕ Connection failed: " + (err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="⚙ AI Provider Settings"
        subtitle="Configure which AI service powers CV parsing, analysis, and generation."
      />

      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Select AI Provider</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROVIDER_ORDER.map((id) => {
            const p = AI_PROVIDERS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveProvider(id)}
                className={`provider-card text-left ${active === id ? "selected" : ""}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl dark:bg-slate-800">
                    {p.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.description}</div>
                  </div>
                  {isAIConfigured({ ...providers, activeProvider: id }) ? (
                    <span className="ml-auto text-xs text-green-600 dark:text-green-400">● ready</span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{p.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Configure {info.name}</h2>
          {info.keyUrl ? (
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              Get an API key ↗
            </a>
          ) : null}
        </div>

        <div className="space-y-3">
          {active === "custom" ? (
            <Field label="API Endpoint URL">
              <input
                type="text"
                value={config.endpoint ?? ""}
                onChange={(e) =>
                  updateProviderConfig(active, { endpoint: e.target.value })
                }
                placeholder="http://localhost:11434/v1/chat/completions"
                className="w-full px-3 py-2 rounded-lg text-sm"
              />
            </Field>
          ) : null}

          <Field label={active === "custom" ? "API Key (optional)" : "API Key"}>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) =>
                updateProviderConfig(active, { apiKey: e.target.value })
              }
              placeholder={active === "custom" ? "Leave blank if not required" : "sk-…"}
              className="w-full px-3 py-2 rounded-lg text-sm"
            />
          </Field>

          <Field label="Model">
            {active === "custom" ? (
              <input
                type="text"
                value={config.model}
                onChange={(e) =>
                  updateProviderConfig(active, { model: e.target.value })
                }
                placeholder="llama3.1, mistral, etc."
                className="w-full px-3 py-2 rounded-lg text-sm"
              />
            ) : (
              <select
                value={config.model}
                onChange={(e) =>
                  updateProviderConfig(active, { model: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                {info.modelGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.models.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="btn-ghost px-4 py-2 rounded-lg text-sm"
          >
            🔌 Test Connection
          </button>
          {config.apiKey || config.endpoint ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 px-2">
              <Check className="w-3.5 h-3.5" /> Key saved
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 mt-3 dark:text-slate-400">
          Keys are saved automatically in this browser and persist across visits —
          never sent anywhere except the provider&apos;s API.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
