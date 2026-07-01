// ============== SHAREABLE RESUME LINK ==============
// Self-contained share links: the resume is encoded into the URL fragment, so
// no server/storage is needed. The /share page decodes and renders it.

import type { Profile, TemplateId } from "./types";
import { migrateTemplateId } from "./templates";

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
    const o = JSON.parse(fromB64Url(hash)) as { p?: Profile; t?: string };
    if (!o || !o.p) return null;
    // Old share links may carry pre-redesign template ids — migrate them.
    return { profile: o.p, templateId: migrateTemplateId(o.t) };
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, profile: Profile, templateId: TemplateId): string {
  return `${origin}/share#${encodeResume(profile, templateId)}`;
}
