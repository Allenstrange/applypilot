import { create } from 'zustand'
import { getAIConfig, isAIConfigured } from './ai'
import type { AIConfig } from './types'
import { saveAIConfig } from './ai'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppStore {
  toasts: Toast[]
  aiConfigured: boolean
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  saveAndUpdateAI: (config: AIConfig) => void
  refreshAIStatus: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  toasts: [],
  aiConfigured: isAIConfigured(),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  saveAndUpdateAI: (config) => {
    saveAIConfig(config)
    set({ aiConfigured: !!config.apiKey })
  },

  refreshAIStatus: () => {
    const cfg = getAIConfig()
    set({ aiConfigured: !!cfg?.apiKey })
  },
}))
