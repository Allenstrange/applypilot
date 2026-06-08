# ApplyPilot

> AI Job Application Assistant — a single-file web app that tailors your CV to a job description, scores ATS compatibility, and tracks applications.

## What it does

A dark-themed, single-page web app (no build step) that helps job seekers:

1. **Maintain a master profile** — manually, or by uploading a `.docx`/`.pdf` CV and letting the AI parse it into structured data.
2. **Analyse a job description** — paste a JD, get keyword extraction and an ATS compatibility scan against your profile.
3. **Tailor your CV** — live editor with per-bullet AI enhancement (rewrite for impact, technical depth, quantification, etc.) and a side-by-side preview that highlights matched keywords.
4. **Track applications** — pipeline of `Planned → Applied → Interview → Offer → Rejected`, with CSV export.
5. **Export** — CV as printable HTML, profile as JSON, tracker as CSV.

## Tech

- **Single self-contained HTML file** (`index.html`) — no build, no server, no install. Open in any modern browser.
- **Tailwind CSS** via CDN.
- **External libs via CDN**: `FileSaver.js` (exports), `mammoth.js` (DOCX parsing), `pdf.js` (PDF parsing).
- **AI providers** (user-configured, credentials stored in `localStorage`):
  - OpenAI (`gpt-4o`, `o3`, `o4` reasoning models, etc.)
  - Anthropic (`claude-sonnet-4`, etc.)
  - Google Gemini
  - Any OpenAI-compatible endpoint (Ollama, LM Studio, etc.)
- **State persistence**: `localStorage` keys `applypilot_state_v3`, `applypilot_providers_v3`.

## Usage

```bash
# Just open the file
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

Or, if you want a quick local server (recommended when embedding external CDN content — avoids some CORS quirks for `.docx`/`.pdf` parsing):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
.
├── index.html        # The entire app — HTML + CSS + JS
└── README.md
```

Everything lives in `index.html`. State, styles, logic, and the AI provider configuration UI are all in that single file.

## AI provider setup

1. Open the app and click **⚙ Configure AI Provider** in the sidebar.
2. Pick a provider (OpenAI, Anthropic, Gemini, or Custom).
3. Paste your API key and pick a model.
4. Click **🔌 Test Connection** to confirm.
5. The key is stored only in your browser's `localStorage` — never sent anywhere except the provider's API.

## Notes for contributors / agents

- The app expects to be served from a directory (not `file://`) when parsing uploaded PDFs — the PDF.js worker has CORS issues with `file://`. Use a local server.
- All state mutations go through `saveState()` — keep that pattern.
- AI calls go through `callAI(prompt)` — don't bypass it.
- Don't commit `localStorage` snapshots, screenshots, or test JDs to the repo. Add them to `.gitignore` if needed.

## Licence

Personal use. No licence set yet.
