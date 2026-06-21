// ============== SHAREABLE RESUME LINK ==============
// Self-contained share links: the resume is encoded into the URL fragment, so
// no server/storage is needed. The /share page decodes and renders it.

import type { Profile, TemplateId } from "./types";

function toB64Url(json: string): string {
  const b = btoa(unescape(encodeURIComponent(json)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  let b = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

export function encodeResume(profile: Profile, templateId: TemplateId): string {
  return toB64Url(JSON.stringify({ p: profile, t: templateId }));
}

export function decodeResume(hash: string): { profile: Profile; templateId: TemplateId } | null {
  try {
    const o = JSON.parse(fromB64Url(hash)) as { p?: Profile; t?: TemplateId };
    if (!o || !o.p) return null;
    return { profile: o.p, templateId: (o.t ?? "classic") as TemplateId };
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, profile: Profile, templateId: TemplateId): string {
  return `${origin}/share#${encodeResume(profile, templateId)}`;
}
