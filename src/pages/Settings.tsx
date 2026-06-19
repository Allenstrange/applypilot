import { useState } from 'react'
import { getAIConfig, MODEL_OPTIONS, testConnection } from '@/lib/ai'
import { useAppStore } from '@/lib/store'
import type { AIConfig } from '@/lib/types'
import { Settings as SettingsIcon, CheckCircle2, XCircle, Eye, EyeOff, Wifi } from 'lucide-react'

const PROVIDERS = [
  { value: 'openai',    label: 'OpenAI',    desc: 'GPT-4o, GPT-4 Turbo, GPT-3.5' },
  { value: 'anthropic', label: 'Anthropic', desc: 'Claude Opus, Sonnet, Haiku' },
  { value: 'gemini',    label: 'Google Gemini', desc: 'Gemini 1.5 Pro, Flash' },
  { value: 'grok',      label: 'xAI Grok', desc: 'Grok Beta' },
  { value: 'custom',    label: 'Custom / Ollama', desc: 'Self-hosted or any OpenAI-compatible API' },
] as const

export default function Settings() {
  const { saveAndUpdateAI, addToast } = useAppStore()
  const existing = getAIConfig()
  const [provider, setProvider] = useState<AIConfig['provider']>(existing?.provider ?? 'openai')
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '')
  const [model, setModel] = useState(existing?.model ?? MODEL_OPTIONS.openai[0])
  const [endpoint, setEndpoint] = useState(existing?.endpoint ?? '')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; error?: string } | null>(null)

  function handleProviderChange(p: AIConfig['provider']) {
    setProvider(p)
    setModel(MODEL_OPTIONS[p]?.[0] ?? 'custom')
    setTestResult(null)
  }

  function save() {
    if (!apiKey.trim()) { addToast('API key is required', 'error'); return }
    saveAndUpdateAI({ provider, apiKey: apiKey.trim(), model, endpoint })
    addToast('AI settings saved', 'success')
  }

  async function runTest() {
    if (!apiKey.trim()) { addToast('Enter an API key first', 'error'); return }
    saveAndUpdateAI({ provider, apiKey: apiKey.trim(), model, endpoint })
    setTesting(true)
    setTestResult(null)
    const result = await testConnection()
    setTestResult(result)
    setTesting(false)
    if (result.success) addToast(`Connected in ${result.latency}ms`, 'success')
    else addToast(result.error ?? 'Connection failed', 'error')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your AI provider for cover letters and smart suggestions</p>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={16} className="text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-300">AI Provider Configuration</h2>
        </div>

        <div className="bg-navy-900 rounded-xl p-4 text-xs text-slate-500 border border-navy-700">
          Your API key is stored only in your browser (localStorage). It is never sent to any server other than your chosen AI provider.
        </div>

        {/* Provider selector */}
        <div>
          <label className="form-label">Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROVIDERS.map(p => (
              <button key={p.value} onClick={() => handleProviderChange(p.value)}
                className={`p-3 rounded-xl border text-left transition-colors ${ provider === p.value ? 'border-teal-500 bg-teal-600/10' : 'border-navy-600 bg-navy-800 hover:border-navy-500' }`}>
                <p className={`text-sm font-medium ${provider === p.value ? 'text-teal-400' : 'text-slate-300'}`}>{p.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="form-label">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="w-full pr-10"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={`${PROVIDERS.find(p => p.value === provider)?.label} API key`}
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="form-label">Model</label>
          {provider === 'custom' ? (
            <input className="w-full" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. llama3.2, mistral" />
          ) : (
            <select className="w-full" value={model} onChange={e => setModel(e.target.value)}>
              {(MODEL_OPTIONS[provider] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>

        {/* Custom endpoint */}
        {provider === 'custom' && (
          <div>
            <label className="form-label">API Endpoint</label>
            <input className="w-full" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="http://localhost:11434/v1/chat/completions" />
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${ testResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' }`}>
            {testResult.success
              ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`text-sm font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.success ? `Connected successfully in ${testResult.latency}ms` : 'Connection failed'}
              </p>
              {testResult.error && <p className="text-xs text-red-300 mt-1">{testResult.error}</p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={runTest} disabled={testing} className="btn-secondary flex-1">
            <Wifi size={15} />{testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button onClick={save} className="btn-primary flex-1">Save Settings</button>
        </div>
      </div>

      {/* About */}
      <div className="card mt-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">About ApplyPilot v2</h2>
        <div className="text-xs text-slate-500 space-y-1">
          <p>AI-powered job application platform built with React, Vite, Tailwind CSS, and Supabase.</p>
          <p>All application data is stored in your personal Supabase instance. AI keys are stored locally in your browser only.</p>
          <p className="text-slate-600 mt-3">v2.0.0 — Vite + React 18 + Supabase + Recharts</p>
        </div>
      </div>
    </div>
  )
}
