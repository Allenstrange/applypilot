// ============== PURE RÉSUMÉ EDIT APPLIER (no AI, no store, no UI) ==============
// The conversational assistant proposes structured `ResumeEdit`s; the user
// reviews each one and chooses to Apply or Dismiss. This module turns an edit
// into a new Profile, deterministically and side-effect free, so it is trivially
// unit-testable. It mirrors the editor's storage conventions: experience bullets
// are a single `\n`-joined string (see app/app/editor/page.tsx, lib/resumeText).

import type { Profile, ResumeEdit } from "./types";

/** Split a role's bullets the same way the editor does (raw lines, no trim). */
function bulletLines(bullets: string): string[] {
  return (bullets || "").split("\n");
}

/** True when the edit references a valid experience entry. */
function hasExp(profile: Profile, edit: ResumeEdit): boolean {
  return (
    typeof edit.expIndex === "number" &&
    edit.expIndex >= 0 &&
    edit.expIndex < profile.experience.length
  );
}

/**
 * Return a NEW Profile with the edit applied. Unknown kinds or out-of-range
 * indices return the profile unchanged, so a malformed edit can never corrupt
 * the draft.
 */
export function applyEdit(profile: Profile, edit: ResumeEdit): Profile {
  switch (edit.kind) {
    case "summary":
      return { ...profile, summary: edit.value };
    case "skills":
      return { ...profile, skills: edit.value };
    case "title":
      return { ...profile, title: edit.value };

    case "bullet": {
      if (!hasExp(profile, edit)) return profile;
      const i = edit.expIndex as number;
      const lines = bulletLines(profile.experience[i].bullets);
      const j = edit.bulletIndex;
      if (typeof j !== "number" || j < 0 || j >= lines.length) return profile;
      const nextLines = lines.slice();
      nextLines[j] = edit.value;
      return {
        ...profile,
        experience: profile.experience.map((e, idx) =>
          idx === i ? { ...e, bullets: nextLines.join("\n") } : e,
        ),
      };
    }

    case "addBullet": {
      if (!hasExp(profile, edit)) return profile;
      const i = edit.expIndex as number;
      const current = profile.experience[i].bullets;
      const next = current.trim() ? `${current}\n${edit.value}` : edit.value;
      return {
        ...profile,
        experience: profile.experience.map((e, idx) =>
          idx === i ? { ...e, bullets: next } : e,
        ),
      };
    }

    default:
      return profile;
  }
}

/**
 * The before/after text for an edit card. `before` is the current value the edit
 * targets (empty for addBullet); `after` is the proposed value.
 */
export function previewEdit(
  profile: Profile,
  edit: ResumeEdit,
): { before: string; after: string } {
  let before = "";
  switch (edit.kind) {
    case "summary":
      before = profile.summary;
      break;
    case "skills":
      before = profile.skills;
      break;
    case "title":
      before = profile.title;
      break;
    case "bullet": {
      if (hasExp(profile, edit) && typeof edit.bulletIndex === "number") {
        before = bulletLines(profile.experience[edit.expIndex as number].bullets)[
          edit.bulletIndex
        ] ?? "";
      }
      break;
    }
    case "addBullet":
      before = "";
      break;
  }
  return { before: (before || "").trim(), after: (edit.value || "").trim() };
}

/** Human-readable label for where an edit lands, used on the card chip. */
export function editTarget(profile: Profile, edit: ResumeEdit): string {
  switch (edit.kind) {
    case "summary":
      return "Summary";
    case "skills":
      return "Skills";
    case "title":
      return "Headline";
    case "bullet":
    case "addBullet": {
      const role = hasExp(profile, edit)
        ? profile.experience[edit.expIndex as number].role ||
          profile.experience[edit.expIndex as number].company
        : "";
      const label = edit.kind === "addBullet" ? "New bullet" : "Bullet";
      return role ? `${label} · ${role}` : label;
    }
    default:
      return "Edit";
  }
}
