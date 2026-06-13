# ApplyPilot

> AI job-application platform — tailor your CV and cover letters, scan ATS
> compatibility, and track applications. Now a Next.js app (v4); the original
> single-file version lives in [`legacy/`](./legacy).

## Status

Mid-migration from the legacy single-file HTML app to a Next.js platform.

- ✅ **Phase 0** — Next.js 15+/Tailwind v4 scaffold, repo layout, CI
- ✅ **Phase 1** — App shell: cosmic dark theme, sidebar navigation, dashboard
- ✅ **Phase 2** — State (Zustand + localStorage), multi-provider AI client, AI Settings
- ⏳ **Phase 3** — Master Profile + CV import
- ⏳ **Phase 4** — Job Analysis (semantic match + ATS scan + keyword badges)
- ⏳ **Phase 5** — Editing Room: Cover Letter, Resume Summary Booster, Interview Prep Coach, Outreach
- ⏳ **Phase 6** — Exports (PDF via jsPDF, copy to clipboard)
- ⏳ **Phase 7** — Saved generations + Application Tracker
- ⏳ **Phase 8** — Animations (motion/react), polish, edge cases

## Tech

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** — cosmic dark theme with amber/indigo accents
- **State:** Zustand persisted to `localStorage` (key `applypilot_v4`)
- **Icons:** `lucide-react` · **Animations:** `motion/react` · **PDF:** `jspdf`
- **CV parsing:** `mammoth` (DOCX) + `pdfjs-dist` (PDF)
- **AI providers** (client-side, keys in `localStorage` so you can switch freely):
  OpenAI, Anthropic, Google Gemini, or any OpenAI-compatible endpoint.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Project layout

```
.
├── app/            # Next.js routes (dashboard, profile, analyze, editor, tracker, settings)
├── components/     # Shared UI (Sidebar, Toaster, PageHeader, …)
├── lib/            # Domain types, Zustand store, multi-provider AI client, helpers
├── public/
└── legacy/         # Original single-file HTML app, kept for reference/porting
```

## AI provider setup

1. Open **AI Settings** in the sidebar.
2. Pick a provider (OpenAI, Anthropic, Gemini, or Custom).
3. Paste your API key and pick a model — settings save automatically.
4. Click **🔌 Test Connection** to confirm.

Keys are stored only in your browser's `localStorage` and are sent only to the
provider's API.

## Licence

Personal use. No licence set yet.
