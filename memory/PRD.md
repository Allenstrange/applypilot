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

## Notes / constraints
- No backend by user choice. #1 and #13 must be client-side approximations.
- Provider API keys are user-supplied and stored only in the browser.
