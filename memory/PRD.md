# ApplyPilot — PRD

## Original request
Existing Next.js app "ApplyPilot" (AI job-application platform). User wants to add new
"Core job-search power-ups". Selected features (from the functionality list): 1, 2, 3, 4, 6, 7, 12, 13, 14, 15.

User choices:
- #1 (job URL extraction) & #13 (shareable links): keep app CLIENT-ONLY, approximate the
  server-dependent parts (no backend).
- AI features: keep bring-your-own-key model (provider keys in browser localStorage).
- Delivery: phased.

## Architecture
- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4. Client-only, state in
  Zustand persisted to localStorage (key `applypilot_v4`).
- AI is multi-provider (OpenAI / Anthropic / Gemini / Grok / Custom), called directly from
  the browser. Logic in `lib/ai.ts`, `lib/generate.ts`, `lib/analysis.ts`.
- Runs on port 3000 via supervisor program `nextapp` (config: /etc/supervisor/conf.d/nextapp.conf).
  NOTE: repo lives at /app root, not /app/frontend — the default supervisor frontend/backend
  programs are FATAL and unused.

## Feature → number mapping (selected)
1 Job URL extraction · 2 Bulk apply · 3 Auto job matching · 4 Funnel dashboard ·
6 Status timeline · 7 Mock interview · 12 Resume comparison · 13 Shareable link ·
14 DOCX + PDF templates · 15 One-click ATS rewrite

## Implemented
### Phase 1 — AI power-ups (2026-06-21) — DONE & verified
- #3 + #2 **Job Matcher** (`app/app/match/page.tsx`, `lib/match.ts`): paste one or many job
  postings, AI ranks them by fit % with verdict, reasons, gaps; "Track" adds to tracker.
- #7 **Mock Interview** (`app/app/interview/page.tsx`, `lib/interview.ts`): turn-based AI
  interviewer; scores each answer (0-100) with strengths/improvements/model answer; running avg.
- #15 **One-click ATS Rewrite** (`lib/generate.ts:optimizeResumeForJob`, button in editor CVTab):
  rewrites summary/skills/bullets to align with the job without inventing facts.
- Nav + dashboard quick actions updated (Sidebar.tsx, app/app/page.tsx).
- Verified: all 4 AI flows pass end-to-end against real Gemini (gemini-3.5-flash); routes 200; tsc clean.

### Bug fixes during Phase 1 (by testing agent)
- CRITICAL: Next 16 dev blocked cross-origin RSC → app non-interactive. Fixed via
  `allowedDevOrigins` in `next.config.ts` (do NOT revert).
- `lib/useHydrated.ts` switched to useState+useEffect; `ThemeProvider.tsx` mount-gated.

## Backlog (next phases)
### Phase 2 — Analytics & tracking (2026-06-21) — DONE & verified (100%)
- #4 **Insights funnel** (`app/app/insights/page.tsx`, `lib/insights.ts`): conversion funnel
  planned→applied→interview→offer with reached-counts and 3 conversion-rate dials + stat cards.
- #6 **Status timeline** (`app/app/tracker/page.tsx`, store `statusHistory`): expandable per-app
  timeline; status changes append to history. Nav "Insights" added (BarChart3).
### Phase 3 — Workflow (2026-06-21) — DONE & verified (100%, 16/16)
- #12 **Resume comparison** (`app/app/compare/page.tsx`, `lib/compare.ts`): pick two resumes
  (or vs Master Profile) → side-by-side score rings, per-category breakdown with winner trophies,
  case-insensitive skills set-diff (Only A / Both / Only B), and LCS word-level summary diff.
  Nav "Compare Resumes" (GitCompare) + "Compare" link on the Resumes page.
### Phase 4 — Export & share (2026-06-21) — DONE & verified (100%, testing agent iteration_4)
- #1 **Job URL import** (`lib/jobUrl.ts`, analyze page): paste a posting URL → fetches readable
  text via the r.jina.ai reader proxy (CORS-friendly) and, if AI is configured, auto-fills
  company/title/location. Graceful "paste manually" fallback. NOTE: depends on the external
  r.jina.ai public proxy; some sites/logins won't be fetchable.
- #13 **Shareable resume link** (`lib/share.ts`, public `app/share/page.tsx`): resume is encoded
  into the URL fragment (base64url, no server). "Share link" button on the resume detail page
  copies a self-contained link; `/share#...` renders a clean read-only resume + Download PDF.
- #14 **Word (.doc) export** (`lib/docx.ts`): template-aware Word-compatible export wired on the
  resume detail page (uses the resume's template) and in the Editing Room (classic). Multiple
  PDF templates already existed via `lib/resumePdf.ts`.

## ALL 10 SELECTED FEATURES COMPLETE (1,2,3,4,6,7,12,13,14,15).

## Enhancement round 1 — Partials completed (2026-06-21)
Finished 5 partially-built enhancement items:
- **Bulk CV tailoring** (`app/app/match/page.tsx`, uses `lib/generate.optimizeResumeForJob`):
  per-result "Tailor CV" (saves a tailored resume to the library + downloads PDF) and a
  "Tailor CVs for all" bulk button that ATS-optimises every ranked job and saves each to the
  resume library. (AI-dependent — runs with the user's configured provider key.)
- **Funnel analytics depth** (`lib/insights.ts`, insights page): added `computeResponse`
  (avg days applied→interview, interview→offer, and applied→first-response from statusHistory)
  and `computeCVPerf` (best-performing CV angle, grouped by target role, ranked by interview
  rate). Two new cards on the Insights page. Verified end-to-end with seeded data.
- **3-option AI bullet rewriter** (`lib/generate.enhanceBulletVariants`, editor CVTab):
  the per-bullet ✨AI menu now fetches THREE rewrite options shown in a pick-list. (AI-dependent.)
- **Inline keyword gaps** (editor CVTab Live Match Rate panel): missing JD keywords now shown
  inline as red dashed chips (+ matched in green), updating live as you type. Verified visually.
- **Notes edit UI** (`app/app/tracker/page.tsx` `NotesEditor`, store `updateApplicationNotes`):
  editable per-application notes textarea with Save + unsaved-changes indicator. Verified e2e.

## Enhancement round 2 — Per-resume performance tracking (2026-06-21)
- `Application` now carries `resumeId`/`resumeName` (`lib/types.ts`). Store action
  `setApplicationResume` (`lib/store.ts`) links a resume to an application.
- Job Matcher "Tailor CV" now auto-saves the tailored resume to the library AND tracks/links
  the application (dedups by company+title). Tracker has a new "CV used" dropdown column to
  attach/reassign a resume to any application.
- `computeCVPerf` (`lib/insights.ts`) now groups by actual `resumeId` (fallback to target role
  for legacy apps); Insights card renamed "Resume performance". Backward-compatible, no migration.
- Verified e2e: CV-used dropdown pre-selects linked resume; analytics aggregate by resume.

## Ops notes (2026-06-21)
- Repo had no node_modules and no supervisor program. Ran `yarn install --ignore-engines`
  (Node 20 vs pdfjs-dist wanting 22 — client-side lib, safe) and created
  `/etc/supervisor/conf.d/nextapp.conf` (`yarn dev`, port 3000, dir /app). App runs as `nextapp`.

## Enhancement round 3 — Competitor-inspired features (2026-06-21)
Built 8 features benchmarked against FlowCV/Jobscan/Teal/Rezi/Kickresume/Enhancv. All verified e2e; tsc clean.
- **#1 Kanban tracker view** (`tracker/page.tsx`): Table/Board toggle; 5 status columns with
  HTML5 drag-and-drop cards (drop → setApplicationStatus); cards show linked resume.
- **#2 Live Resume Score in Editing Room** (`editor/page.tsx`): added `ResumeScorePanel` to the CV tab.
- **#4 Cover-letter tone selector** (`generate.generateCoverLetter(tone)`): 6 tones in CoverLetterTab.
- **#5 Match-rate benchmark** ("Aim for 75%+") on the editor Live Match Rate panel.
- **#6 Templates + design controls** (`templates.ts`, `resumes/[id]`): 3→6 templates, accent colour
  picker (swatches + custom), threaded into preview/PDF/DOCX via optional `accent` on ResumeDoc.
- **#8 Inline AI for summary & skills** (`generate.enhanceTextVariants`): 3-option rewrites in CV tab.
- **#10 Inline canvas editing** (`ResumePreview.tsx`): click-to-edit contentEditable fields
  (name/summary/skills/experience/education), commit on blur. Enabled in `resumes/[id]`.
- **#11 Section reordering** (`ResumeDoc.sectionOrder`): drag + up/down arrows; honored in
  preview, PDF and DOCX. `SectionKey`/`DEFAULT_SECTION_ORDER`/`SECTION_LABELS` in templates.ts.
- Backward-compatible: `accent`/`sectionOrder` optional, default to template/standard order.

## Enhancement round 4 — Onboarding tour (2026-06-21)
- `components/OnboardingTour.tsx`: dependency-free welcome modal + 7-step spotlight tour
  (CSS box-shadow cut-out, tooltip with Back/Next/Skip + progress dots). Navigates routes per step.
- Auto-shows once for fresh users (`!onboarded && empty state`); re-triggerable via the sidebar
  "Take a tour" button (`window` event `applypilot:start-tour`). Mounted in `app/app/layout.tsx`.
- Store gained `onboarded: boolean` + `setOnboarded`. Sidebar nav links carry `data-tour` selectors.
- Verified e2e: welcome → tour → step/route advance all work; tsc clean.

## Bug fix — CV import crash on Safari (2026-06-21)
- Symptom: "undefined is not a function (near '...value of readableStream...')" when importing a PDF.
- Cause: `pdfjs-dist@6` `getTextContent()` uses `for await (const v of readableStream)`; Safari/WebKit
  has no `ReadableStream.prototype[Symbol.asyncIterator]`.
- Fix: added the WHATWG-spec async-iterator polyfill (guarded, only when missing) in
  `lib/cvParser.ts` `readPdfText()` before pdf.js loads. Verified PDF import runs without error.

## Notes / constraints
- No backend by user choice. #1 and #13 must be client-side approximations.
- Provider API keys are user-supplied and stored only in the browser.

## UI/UX round 5 (2026-06-22)
- Inline-edit affordance (ResumePreview.tsx): dotted underline (inline) / dashed left-border (block) + "click to edit" tooltip.
- Kanban polish (tracker/page.tsx): colour-tinted column headers per status, pill count badges, drag-over column highlight (dragOverCol), smooth card transitions.
- Mobile: kanban columns w-[78vw] with snap-x scroll on phones.
- Loading skeletons: components/Skeleton.tsx (Skeleton + PageSkeleton, shimmer in globals.css) for editor/resume-editor hydration and AI-generation busy state.
