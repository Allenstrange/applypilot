# Competitive Analysis — Distilled Gap & Feature Themes

Synthesised from the two research files you shared. The **two reports are research, not a feature wishlist** — they describe what competitors do, and where ApplyPilot could do better. Below is the candidate feature surface they imply. Use this to pick what you actually want Jules to build.

---

## What both reports agree on as the biggest gaps

1. **Literal-keyword matching is broken** — Jobscan, Teal, Rezi all match strings, not meaning. "AWS" vs "Amazon Web Services" gets flagged. A semantic, LLM-driven gap analysis is the single biggest technical moat.
2. **Data silos inside one product** — updating a bullet in the resume builder doesn't update the cover letter, doesn't update the autofill profile, doesn't update the tracker. The "Master Profile → everything else" architecture is the right pattern.
3. **ATS-parser compatibility** — Sovren/Textkernel are the de-facto parsers. Single-column, standard fonts, explicit heading hierarchy, no text boxes, no images. Anything fancier is a 50% extraction-rate risk.
4. **LLM hallucination** — competitors invent metrics and previous employers. Strict prompt constraints ("only rephrase, never invent") + low temperature (~0.1) is the mitigation.
5. **Predatory billing** — Resume.io's 28-day cycle that bills 13×/year, Jobscan's $49.95/mo, etc. A free, lean, personal tool is a real differentiator.

---

## Concrete features both reports point to (candidate Jules prompts)

### Tier 1 — high value, fits the current single-file HTML app

| # | Feature | Why | Effort |
|---|---|---|---|
| 1 | **Master Profile as single source of truth** (already partially there) — make it explicit that editor + cover letter + tracker all read from one JSON blob | Resolves data silos | Small (refactor) |
| 2 | **Semantic (LLM-driven) JD analysis** — replace regex keyword match with an LLM call that extracts *concepts* and matches to your profile | Biggest technical moat | Medium |
| 3 | **Cover letter generator** — 3-paragraph, anti-AI-filler prompt, hooks into tailored CV | Every competitor has it; yours is missing | Small/medium |
| 4 | **Outreach / cold message generator** — 3-sentence LinkedIn DM or recruiter email variant | The "3-sentence outreach" pattern (report 2) | Small |
| 5 | **Application tracker improvements** — sortable table, status pipeline, CSV export (you have this), + per-application contact/follow-up notes | Huntr is the gold standard here | Small |
| 6 | **Saved-tailored-version library** — each "Analyse Job" run stores a tailored version you can return to, re-edit, or duplicate | Avoids overwriting a good tailored version | Small |

### Tier 2 — needs more architecture, but high value

| # | Feature | Why | Effort |
|---|---|---|---|
| 7 | **Strict anti-hallucination prompt wrapper** for all AI calls — temperature ~0.1, system prompt that forbids new nouns/numbers/names, only allows rephrasing of provided input | Report 1 §"Managing LLM Hallucinations" | Small (prompt engineering) |
| 8 | **Local ATS-parser-emulation check** — read the generated CV's plain-text version, simulate what Sovren/Textkernel would extract, flag missing fields | Catches formatting regressions before submission | Medium (new code) |
| 9 | **DOCX export that respects ATS rules** — single column, explicit `<h1>`/`<h2>`, no images, system fonts, real .docx file (currently you have HTML export) | You have an HTML export but a true .docx is the format ATSes expect | Medium |
| 10 | **Master Block Library / modular achievements** — store professional accomplishments as discrete reusable blocks with tags ("leadership", "cloud", "incident response") that the tailoring engine can rank and combine | Report 1 Phase 3; avoids re-typing the same bullet for 5 jobs | Medium (data model change) |
| 11 | **PDF export of tailored CV** (clean, single-column, ATS-safe) | You have HTML preview; PDF is the deliverable format | Small (add a print stylesheet + html2pdf.js) |

### Tier 3 — needs an extension / backend, not just a web app

| # | Feature | Why | Effort |
|---|---|---|---|
| 12 | **Chrome extension / Job Clipper** — paste URL, capture JD, salary, company metadata into the tracker | Huntr/Teal/Simplify all do this | High (separate codebase) |
| 13 | **Autofill extension** for Workday/Greenhouse/Lever | Simplify's moat; report 1 explicitly recommends avoiding DOM scraping — write hand-tuned schemas per ATS | Very high |
| 14 | **LinkedIn profile scorer** | Careerflow's standout feature | Medium (separate chrome ext) |

### Tier 4 — infra / portability

| # | Feature | Why | Effort |
|---|---|---|---|
| 15 | **LinkedIn import** via PDF (you already have DOCX/PDF upload) | Removes cold-start friction | Small (already works for DOCX/PDF, just verify LinkedIn export works) |
| 16 | **JSON Schema validation on profile import** (Pydantic-style in JS) | Report 1 §"Infrastructure" — robust JSON support | Small |
| 17 | **Rate-limit / cost guard for AI calls** — show estimated token cost, warn if user is about to burn credits | Every AI product needs this | Small |
| 18 | **Multiple CV variants picker** (you already have several — Junior IT Support, IT Analyst, Field Service) | You mentioned these in your user profile; the app should let you switch between them | Small (UI + state) |

---

## What's NOT in either report (intentional gaps)

Neither report discusses:
- **Interview prep / mock interview** (mentioned in Careerflow's Premium Plus tier but not analysed in depth)
- **Salary research / comp benchmarking** (Levels.fyi-style)
- **Referral-finding / network mapping**
- **Email follow-up sequences / drip campaigns**
- **Application analytics** (response rates, time-to-response, source-of-application stats)

You may or may not care about these.

---

## My recommendation for sequencing Jules prompts

In the order that gives the most user-visible value per prompt:

1. **Cover letter generator** (3, Tier 1) — biggest missing feature, low effort
2. **Strict anti-hallucination wrapper** (7, Tier 2) — protects everything else
3. **Semantic JD analysis** (2, Tier 1) — replaces the weakest part of the current app
4. **Saved tailored versions library** (6, Tier 1) — small but a big UX win
5. **DOCX export** (9, Tier 2) — the format ATSes actually want
6. **PDF export with ATS-safe print stylesheet** (11, Tier 2) — quick win
7. **CV variants picker** (18, Tier 4) — directly serves you (you have 4 variants)
8. **Application tracker: contact/follow-up notes** (5, Tier 1) — extends what you have

Skip the extension features (Tier 3) for now — they're a different codebase and don't make sense in a single-file HTML app.
