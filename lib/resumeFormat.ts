// Shared text parsing for resume rendering, used by both the on-screen preview
// (ResumePreview) and the PDF exporter (resumePdf) so formatting stays in sync.
// Inputs are typed as optional and default to "" to stay safe against partial
// persisted data.

export function parseBullets(str: string | undefined | null): string[] {
  return (str ?? "")
    .split("\n")
    .map((b) => b.replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function parseList(str: string | undefined | null): string[] {
  return (str ?? "")
    .split(/[\n·|,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseLines(str: string | undefined | null): string[] {
  return (str ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
