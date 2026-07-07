"use client";

import Link from "next/link";
import { AlarmClock, Hourglass, FilePlus2, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated, useNow } from "@/lib/useHydrated";

interface AttentionItem {
  id: string;
  icon: LucideIcon;
  tone: "red" | "amber";
  text: string;
  href: string;
  cta: string;
}

const STALE_DAYS = 7;

/**
 * "What needs you today" — the dashboard surfaces overdue follow-ups, stalled
 * applications, and an analysed job that was never tracked, each one click
 * from the place it gets fixed.
 */
export default function AttentionStrip() {
  const hydrated = useHydrated();
  const now = useNow();
  const applications = useStore((s) => s.applications);
  const analysis = useStore((s) => s.currentAnalysis);
  const draftCV = useStore((s) => s.draftCV);

  if (!hydrated) return null;

  const items: AttentionItem[] = [];

  // 1. Overdue next actions — the most urgent thing in the app.
  for (const a of applications) {
    if (a.nextAction && new Date(a.nextAction.when).getTime() <= now) {
      items.push({
        id: `due-${a.id}`,
        icon: AlarmClock,
        tone: "red",
        text: `${a.nextAction.what} — ${a.company}`,
        href: `/app/tracker/${a.id}`,
        cta: "Open job",
      });
    }
  }

  // 2. Applications with no movement for a week (still early in the funnel).
  for (const a of applications) {
    if (a.status !== "planned" && a.status !== "applied") continue;
    if (a.nextAction && new Date(a.nextAction.when).getTime() <= now) continue; // already listed
    const hist = a.statusHistory ?? [];
    const lastMove = new Date(hist[hist.length - 1]?.at ?? a.createdAt).getTime();
    const days = Math.floor((now - lastMove) / 86400000);
    if (days >= STALE_DAYS) {
      items.push({
        id: `stale-${a.id}`,
        icon: Hourglass,
        tone: "amber",
        text: `No movement in ${days} days — ${a.title} at ${a.company}`,
        href: `/app/tracker/${a.id}`,
        cta: "Follow up",
      });
    }
  }

  // 3. An analysed job that was never saved anywhere.
  if (
    analysis &&
    draftCV &&
    !applications.some((a) => a.company === analysis.company && a.title === analysis.title)
  ) {
    items.push({
      id: "untracked",
      icon: FilePlus2,
      tone: "amber",
      text: `${analysis.title} at ${analysis.company} is tailored but not tracked`,
      href: "/app/editor",
      cta: "Finish it",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="card rounded-xl p-5 mb-6" data-testid="attention-strip">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Needs attention ({items.length})
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 4).map(({ id, icon: Icon, tone, text, href, cta }) => (
          <li key={id}>
            <Link
              href={href}
              data-testid={`attention-${id}`}
              className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                tone === "red"
                  ? "border-red-500/25 bg-red-500/5 hover:border-red-500/50"
                  : "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${tone === "red" ? "text-red-500" : "text-amber-500"}`}
              />
              <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">{text}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium shrink-0 ${
                  tone === "red" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {cta} <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
