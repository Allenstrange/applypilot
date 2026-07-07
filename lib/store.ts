// ============== GLOBAL STATE (Zustand + localStorage) ==============
// Ported from the legacy static app (js/state.js).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { migrateTemplateId } from "./templates";
import { quickMatchScore } from "./matchReport";
import type {
  Profile,
  Application,
  ApplicationContact,
  ProviderSettings,
  ProviderId,
  ProviderConfig,
  Analysis,
  Generations,
  GenerationMode,
  ResumeDoc,
  TemplateId,
  LibraryBullet,
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
  groq: { apiKey: "", model: "llama-3.3-70b-versatile" },
  openrouter: { apiKey: "", model: "deepseek/deepseek-r1:free" },
  opencode: { apiKey: "", model: "" },
  custom: { endpoint: "", apiKey: "", model: "" },
};

interface AppState {
  profile: Profile;
  applications: Application[];
  currentAnalysis: Analysis | null;
  draftCV: Profile | null;
  /** The library CV the current draft was seeded from (null = master profile). */
  draftBaseResumeId: string | null;
  /** A job handed off from the Matcher, waiting for the Analyze page to pick up. */
  pendingJob: { company: string; title: string; jd: string } | null;
  generations: Generations;
  resumes: ResumeDoc[];
  /** Reusable achievement bullets, saved once and inserted into any draft. */
  bulletLibrary: LibraryBullet[];
  providers: ProviderSettings;
  onboarded: boolean;

  // ----- profile -----
  setProfile: (patch: Partial<Profile>) => void;
  replaceProfile: (profile: Profile) => void;

  // ----- resume library -----
  addResume: (name: string, templateId: TemplateId, profile: Profile) => string;
  updateResume: (
    id: string,
    patch: Partial<
      Pick<
        ResumeDoc,
        "name" | "templateId" | "profile" | "accent" | "font" | "density" | "headingUppercase" | "headingUnderline" | "sectionOrder" | "targetJob"
      >
    >,
  ) => void;
  removeResume: (id: string) => void;
  duplicateResume: (id: string) => string | null;

  // ----- analysis / editor -----
  /** Hand a job to the Analyze page (e.g. from the Matcher). */
  setPendingJob: (job: { company: string; title: string; jd: string } | null) => void;
  /** Set the current analysis; `base`/`baseId` pick which CV seeds the draft (defaults to the master profile). */
  setAnalysis: (analysis: Analysis, base?: Profile, baseId?: string) => void;
  setDraftCV: (profile: Profile) => void;
  updateDraftCV: (patch: Partial<Profile>) => void;
  setGeneration: <K extends GenerationMode>(
    mode: K,
    payload: NonNullable<Generations[K]>,
  ) => void;
  /**
   * Save the tailored draft into the CV library. `mode:"update"` overwrites the
   * base CV it came from; `mode:"new"` (default) creates a fresh CV. Returns the
   * saved resume id, or null if there is no draft.
   */
  saveDraftToLibrary: (mode?: "new" | "update") => string | null;

  // ----- bullet library -----
  /** Save a bullet for reuse. Returns false when an identical one already exists. */
  saveBulletToLibrary: (text: string) => boolean;
  removeLibraryBullet: (id: string) => void;

  // ----- tracker -----
  addApplication: (app: Application) => void;
  removeApplication: (id: number) => void;
  setApplicationStatus: (id: number, status: Application["status"]) => void;
  updateApplicationNotes: (id: number, notes: string) => void;
  setApplicationResume: (id: number, resumeId: string) => void;
  addApplicationContact: (appId: number, contact: Omit<ApplicationContact, "id">) => void;
  removeApplicationContact: (appId: number, contactId: string) => void;
  setApplicationNextAction: (appId: number, action: { what: string; when: string } | null) => void;
  saveCurrentToTracker: () => "saved" | "exists" | "no-analysis";
  loadApplication: (id: number) => boolean;

  // ----- providers -----
  setActiveProvider: (id: ProviderId) => void;
  updateProviderConfig: (id: ProviderId, patch: Partial<ProviderConfig>) => void;

  // ----- onboarding -----
  setOnboarded: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: emptyProfile,
      applications: [],
      currentAnalysis: null,
      draftCV: null,
      draftBaseResumeId: null,
      pendingJob: null,
      generations: {},
      resumes: [],
      bulletLibrary: [],
      providers: defaultProviders,
      onboarded: false,

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

      setPendingJob: (job) => set({ pendingJob: job }),
      setAnalysis: (analysis, base, baseId) =>
        set((s) => ({
          currentAnalysis: analysis,
          // Start a fresh CV draft (from the chosen base CV, or the master
          // profile) and clear stale generations for the new job.
          draftCV: JSON.parse(JSON.stringify(base ?? s.profile)) as Profile,
          draftBaseResumeId: baseId ?? null,
          generations: {},
        })),
      setDraftCV: (profile) => set({ draftCV: profile }),
      updateDraftCV: (patch) =>
        set((s) => ({ draftCV: s.draftCV ? { ...s.draftCV, ...patch } : s.draftCV })),
      setGeneration: (mode, payload) =>
        set((s) => ({ generations: { ...s.generations, [mode]: payload } })),
      saveDraftToLibrary: (mode = "new") => {
        const s = get();
        if (!s.draftCV) return null;
        const profile = JSON.parse(JSON.stringify(s.draftCV)) as Profile;
        const a = s.currentAnalysis;
        const targetJob = a ? { title: a.title, company: a.company } : undefined;

        if (mode === "update" && s.draftBaseResumeId) {
          const base = s.resumes.find((r) => r.id === s.draftBaseResumeId);
          if (base) {
            get().updateResume(base.id, { profile, targetJob });
            return base.id;
          }
        }
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const name = a ? `${a.title} — ${a.company}` : profile.name ? `${profile.name}'s CV` : "Tailored CV";
        const base = s.draftBaseResumeId
          ? s.resumes.find((r) => r.id === s.draftBaseResumeId)
          : undefined;
        set((st) => ({
          resumes: [
            {
              id,
              name,
              templateId: base?.templateId ?? "classic-clear",
              accent: base?.accent,
              font: base?.font,
              density: base?.density,
              headingUppercase: base?.headingUppercase,
              headingUnderline: base?.headingUnderline,
              sectionOrder: base?.sectionOrder,
              targetJob,
              profile,
              createdAt: now,
              updatedAt: now,
            },
            ...st.resumes,
          ],
          // The new CV becomes the draft's base so further edits can update it.
          draftBaseResumeId: id,
        }));
        return id;
      },

      saveBulletToLibrary: (text) => {
        const clean = text.replace(/^[-•]\s*/, "").trim();
        if (!clean) return false;
        const s = get();
        if (s.bulletLibrary.some((b) => b.text.toLowerCase() === clean.toLowerCase())) {
          return false;
        }
        set((st) => ({
          bulletLibrary: [
            { id: crypto.randomUUID(), text: clean, createdAt: new Date().toISOString() },
            ...st.bulletLibrary,
          ],
        }));
        return true;
      },
      removeLibraryBullet: (id) =>
        set((s) => ({ bulletLibrary: s.bulletLibrary.filter((b) => b.id !== id) })),

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
      addApplicationContact: (appId, contact) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId
              ? { ...a, contacts: [...(a.contacts ?? []), { ...contact, id: crypto.randomUUID() }] }
              : a,
          ),
        })),
      removeApplicationContact: (appId, contactId) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId
              ? { ...a, contacts: (a.contacts ?? []).filter((c) => c.id !== contactId) }
              : a,
          ),
        })),
      setApplicationNextAction: (appId, action) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId ? { ...a, nextAction: action ?? undefined } : a,
          ),
        })),

      saveCurrentToTracker: () => {
        const s = get();
        const a = s.currentAnalysis;
        if (!a) return "no-analysis";
        const draft = s.draftCV ?? (JSON.parse(JSON.stringify(s.profile)) as Profile);
        const score = quickMatchScore(draft, a.jdKeywords);
        const now = new Date().toISOString();
        const existing = s.applications.find(
          (app) => app.company === a.company && app.title === a.title,
        );
        if (existing) {
          // Re-saving acts as a rescan: refresh the snapshot and record the
          // score so the tracker shows the tailoring trend over time.
          set((st) => ({
            applications: st.applications.map((app) => {
              if (app.id !== existing.id) return app;
              const hist = app.scoreHistory ?? [];
              const last = hist[hist.length - 1];
              return {
                ...app,
                snapshot: { analysis: a, draftCV: draft, generations: s.generations },
                scoreHistory:
                  last && last.score === score ? hist : [...hist, { at: now, score }],
              };
            }),
          }));
          return "exists";
        }
        const app: Application = {
          id: Date.now(),
          company: a.company,
          title: a.title,
          location: a.location,
          url: a.url,
          status: "planned",
          createdAt: now,
          notes: "",
          statusHistory: [{ status: "planned", at: now }],
          scoreHistory: [{ at: now, score }],
          snapshot: {
            analysis: a,
            draftCV: draft,
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
          draftBaseResumeId: app.resumeId ?? null,
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

      setOnboarded: (v) => set({ onboarded: v }),
    }),
    {
      name: "applypilot_v4",
      storage: createJSONStorage(() => localStorage),
      // Deep-merge persisted state so newly added providers (e.g. Grok) appear
      // for returning users without wiping their saved keys. Saved resumes also
      // migrate pre-redesign template ids to the closest current design.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          resumes: (p.resumes ?? current.resumes).map((r) => ({
            ...r,
            templateId: migrateTemplateId(r.templateId),
          })),
          providers: {
            ...current.providers,
            ...(p.providers ?? {}),
          },
        };
      },
    },
  ),
);
