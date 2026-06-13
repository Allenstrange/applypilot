// ============== GLOBAL STATE (Zustand + localStorage) ==============
// Ported from the legacy static app (js/state.js).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Profile,
  Application,
  ProviderSettings,
  ProviderId,
  ProviderConfig,
} from "./types";

export const emptyProfile: Profile = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  summary: "",
  skills: "",
  certs: "",
  experience: [],
  education: [],
};

const defaultProviders: ProviderSettings = {
  activeProvider: "openai",
  openai: { apiKey: "", model: "gpt-4o-mini" },
  anthropic: { apiKey: "", model: "claude-3-5-sonnet-latest" },
  gemini: { apiKey: "", model: "gemini-1.5-flash" },
  custom: { endpoint: "", apiKey: "", model: "" },
};

interface AppState {
  profile: Profile;
  applications: Application[];
  // currentAnalysis / draftVersion are filled in later phases; kept loose for now.
  currentAnalysis: unknown | null;
  draftVersion: unknown | null;
  providers: ProviderSettings;

  // ----- actions -----
  setProfile: (patch: Partial<Profile>) => void;
  replaceProfile: (profile: Profile) => void;

  addApplication: (app: Application) => void;
  removeApplication: (id: number) => void;
  setApplicationStatus: (id: number, status: Application["status"]) => void;

  setActiveProvider: (id: ProviderId) => void;
  updateProviderConfig: (id: ProviderId, patch: Partial<ProviderConfig>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: emptyProfile,
      applications: [],
      currentAnalysis: null,
      draftVersion: null,
      providers: defaultProviders,

      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      replaceProfile: (profile) => set({ profile }),

      addApplication: (app) =>
        set((s) => ({ applications: [app, ...s.applications] })),
      removeApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
      setApplicationStatus: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),

      setActiveProvider: (id) =>
        set((s) => ({ providers: { ...s.providers, activeProvider: id } })),
      updateProviderConfig: (id, patch) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [id]: { ...s.providers[id], ...patch },
          },
        })),
    }),
    {
      name: "applypilot_v4",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
