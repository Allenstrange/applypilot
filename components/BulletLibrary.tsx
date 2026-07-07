"use client";

import { useMemo, useState } from "react";
import { Library, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast";

/**
 * Reusable achievement bullets (Teal-style): write a strong bullet once, keep
 * it in the library, and drop it into whichever tailored CV needs it. Bullets
 * are ranked by how many of the current JD's keywords they already contain.
 */
export default function BulletLibrary() {
  const bullets = useStore((s) => s.bulletLibrary);
  const removeBullet = useStore((s) => s.removeLibraryBullet);
  const saveBullet = useStore((s) => s.saveBulletToLibrary);
  const draftCV = useStore((s) => s.draftCV);
  const updateDraftCV = useStore((s) => s.updateDraftCV);
  const analysis = useStore((s) => s.currentAnalysis);

  const [open, setOpen] = useState(false);
  const [roleIdx, setRoleIdx] = useState(0);
  const [draft, setDraft] = useState("");

  const ranked = useMemo(() => {
    const jdKeywords = analysis?.jdKeywords ?? [];
    const hits = (text: string) => {
      const lower = text.toLowerCase();
      return jdKeywords.filter((k) => lower.includes(k.toLowerCase()));
    };
    return bullets
      .map((b) => ({ ...b, matches: hits(b.text) }))
      .sort((a, b) => b.matches.length - a.matches.length);
  }, [bullets, analysis]);

  if (!draftCV || draftCV.experience.length === 0) return null;

  function insert(text: string) {
    const exp = draftCV!.experience;
    const already = exp.some((e) =>
      e.bullets.toLowerCase().split("\n").includes(text.toLowerCase()),
    );
    if (already) {
      toast("ℹ That bullet is already in this CV");
      return;
    }
    const experience = exp.map((e, i) =>
      i === roleIdx ? { ...e, bullets: e.bullets.trim() ? `${e.bullets}\n${text}` : text } : e,
    );
    updateDraftCV({ experience });
    toast("✓ Inserted into " + (exp[roleIdx].role || "role"));
  }

  function addManual() {
    const text = draft.trim();
    if (!text) return;
    toast(saveBullet(text) ? "✓ Saved to library" : "ℹ Already in your library");
    setDraft("");
  }

  return (
    <div className="card rounded-xl p-4" data-testid="bullet-library">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="bullet-library-toggle"
        className="flex items-center justify-between w-full text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Library className="w-4 h-4 text-[var(--brand)]" /> Bullet Library
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 tabular-nums">
            ({bullets.length})
          </span>
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open ? (
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Your best bullets, saved once and reused across CVs. Ranked by relevance to this job.
          </p>

          <div className="flex gap-1.5 mb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addManual(); }}
              placeholder="Write a bullet to save for reuse…"
              data-testid="library-new-bullet"
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={addManual}
              disabled={!draft.trim()}
              data-testid="library-add-bullet"
              className="btn-ghost px-2.5 py-1.5 rounded-lg text-xs disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {bullets.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
              Nothing saved yet — use the <Library className="w-3 h-3 inline -mt-0.5" /> icon on any
              CV bullet, or write one above.
            </div>
          ) : (
            <>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Insert into which role?
              </label>
              <select
                value={roleIdx}
                onChange={(e) => setRoleIdx(Number(e.target.value))}
                data-testid="library-role"
                aria-label="Choose a role to insert bullets into"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs mb-2"
              >
                {draftCV.experience.map((e, i) => (
                  <option key={i} value={i}>
                    {e.role || "Untitled role"}{e.company ? ` — ${e.company}` : ""}
                  </option>
                ))}
              </select>

              <ul className="space-y-1.5 max-h-64 overflow-y-auto scrollbar pr-1">
                {ranked.map((b) => (
                  <li
                    key={b.id}
                    data-testid={`library-bullet-${b.id}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-200">{b.text}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {b.matches.length ? (
                        <span
                          title={`Contains: ${b.matches.join(", ")}`}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 tabular-nums"
                        >
                          {b.matches.length} JD keyword{b.matches.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">no JD keywords</span>
                      )}
                      <button
                        type="button"
                        onClick={() => insert(b.text)}
                        data-testid={`library-insert-${b.id}`}
                        className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-[var(--brand)]/40 text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Insert
                      </button>
                      <button
                        type="button"
                        onClick={() => { removeBullet(b.id); toast("✓ Removed from library"); }}
                        aria-label="Remove from library"
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
