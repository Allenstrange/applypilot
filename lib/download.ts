// ============== CLIENT DOWNLOAD HELPERS ==============

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename: string, data: unknown) {
  downloadBlob(
    filename,
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
}

export function downloadText(
  filename: string,
  text: string,
  type = "text/plain;charset=utf-8",
) {
  downloadBlob(filename, new Blob([text], { type }));
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function slugify(s: string): string {
  return (s || "applypilot").replace(/\s+/g, "_").replace(/[^\w-]/g, "");
}
