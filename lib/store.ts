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
  Analysis,
  Generations,
  GenerationMode,
  ResumeDoc,
  TemplateId,
} from "./types";

/** Ensure a tracked application has a seeded status timeline. */
function withInitialHistory(app: Application): Application {
  if (app.statusHistory && app.statusHistory.length) return app;
  return {
    ...app,
    statusHistory: [{ status: app.status, at: app.createdAt }],
  };
}

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
  openai: { apiKey: "", model: "gpt-5.4-mini" },
  anthropic: { apiKey: "", model: "claude-sonnet-4-6" },
  gemini: { apiKey: "", model: "gemini-3.5-flash" },
  grok: { apiKey: "", model: "grok-4.3" },
  custom: { endpoint: "", apiKey: "", model: "" },
};

interface AppState {
  profile: Profile;
  applications: Application[];
  currentAnalysis: Analysis | null;
  draftCV: Profile | null;
  generations: Generations;
  resumes: ResumeDoc[];
  providers: ProviderSettings;

  // ----- profile -----
  setProfile: (patch: Partial<Profile>) => void;
  replaceProfile: (profile: Profile) => void;

  // ----- resume library -----
  addResume: (name: string, templateId: TemplateId, profile: Profile) => string;
  updateResume: (
    id: string,
    patch: Partial<Pick<ResumeDoc, "name" | "templateId" | "profile">>,
  ) => void;
  removeResume: (id: string) => void;
  duplicateResume: (id: string) => string | null;

  // ----- analysis / editor -----
  setAnalysis: (analysis: Analysis) => void;
  setDraftCV: (profile: Profile) => void;
  updateDraftCV: (patch: Partial<Profile>) => void;
  setGeneration: <K extends GenerationMode>(
    mode: K,
    payload: NonNullable<Generations[K]>,
  ) => void;

  // ----- tracker -----
  addApplication: (app: Application) => void;
  removeApplication: (id: number) => void;
  setApplicationStatus: (id: number, status: Application["status"]) => void;
  updateApplicationNotes: (id: number, notes: string) => void;
  setApplicationResume: (id: number, resumeId: string) => void;
  saveCurrentToTracker: () => "saved" | "exists" | "no-analysis";
  loadApplication: (id: number) => boolean;

  // ----- providers -----
  setActiveProvider: (id: ProviderId) => void;
  updateProviderConfig: (id: ProviderId, patch: Partial<ProviderConfig>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: emptyProfile,
      applications: [],
      currentAnalysis: null,
      draftCV: null,
      generations: {},
      resumes: [],
      providers: defaultProviders,

      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      replaceProfile: (profile) => set({ profile }),

      addResume: (name, templateId, profile) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        set((s) => ({
          resumes: [
            { id, name, templateId, profile, createdAt: now, updatedAt: now },
            ...s.resumes,
          ],
        }));
        return id;
      },
      updateResume: (id, patch) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id
              ? { ...r, ...patch, updatedAt: new Date().toISOString() }
              : r,
          ),
        })),
      removeResume: (id) =>
        set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id) })),
      duplicateResume: (id) => {
        const r = get().resumes.find((x) => x.id === id);
        if (!r) return null;
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        set((s) => ({
          resumes: [
            { ...r, id: newId, name: `${r.name} (copy)`, createdAt: now, updatedAt: now },
            ...s.resumes,
          ],
        }));
        return newId;
      },

      setAnalysis: (analysis) =>
        set((s) => ({
          currentAnalysis: analysis,
          // Start a fresh CV draft and clear stale generations for the new job.
          draftCV: JSON.parse(JSON.stringify(s.profile)) as Profile,
          generations: {},
        })),
      setDraftCV: (profile) => set({ draftCV: profile }),
      updateDraftCV: (patch) =>
        set((s) => ({ draftCV: s.draftCV ? { ...s.draftCV, ...patch } : s.draftCV })),
      setGeneration: (mode, payload) =>
        set((s) => ({ generations: { ...s.generations, [mode]: payload } })),

      addApplication: (app) =>
        set((s) => ({ applications: [withInitialHistory(app), ...s.applications] })),
      removeApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
      setApplicationStatus: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id) return a;
            const hist = a.statusHistory ?? [{ status: a.status, at: a.createdAt }];
            const last = hist[hist.length - 1];
            const statusHistory =
              last && last.status === status
                ? hist
                : [...hist, { status, at: new Date().toISOString() }];
            return { ...a, status, statusHistory };
          }),
        })),
      updateApplicationNotes: (id, notes) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, notes } : a,
          ),
        })),
      setApplicationResume: (id, resumeId) =>
        set((s) => {
          const r = s.resumes.find((x) => x.id === resumeId);
          return {
            applications: s.applications.map((a) =>
              a.id === id
                ? { ...a, resumeId: resumeId || undefined, resumeName: r?.name }
                : a,
            ),
          };
        }),
      saveCurrentToTracker: () => {
        const s = get();
        const a = s.currentAnalysis;
        if (!a) return "no-analysis";
        if (
          s.applications.find(
            (app) => app.company === a.company && app.title === a.title,
          )
        ) {
          return "exists";
        }
        const app: Application = {
          id: Date.now(),
          company: a.company,
          title: a.title,
          location: a.location,
          url: a.url,
          status: "planned",
          createdAt: new Date().toISOString(),
          notes: "",
          statusHistory: [{ status: "planned", at: new Date().toISOString() }],
          snapshot: {
            analysis: a,
            draftCV: s.draftCV ?? (JSON.parse(JSON.stringify(s.profile)) as Profile),
            generations: s.generations,
          },
        };
        set((st) => ({ applications: [app, ...st.applications] }));
        return "saved";
      },
      loadApplication: (id) => {
        const app = get().applications.find((a) => a.id === id);
        if (!app?.snapshot) return false;
        set({
          currentAnalysis: app.snapshot.analysis,
          draftCV: app.snapshot.draftCV,
          generations: app.snapshot.generations,
        });
        return true;
      },

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
      // Deep-merge persisted state so newly added providers (e.g. Grok) appear
      // for returning users without wiping their saved keys.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          providers: {
            ...current.providers,
            ...(p.providers ?? {}),
          },
        };
      },
    },
  ),
);
