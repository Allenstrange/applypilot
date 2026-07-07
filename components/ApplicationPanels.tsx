"use client";

// Shared building blocks for anywhere an application is displayed in depth —
// the tracker's expanded rows and the per-job workspace page.

import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Users, AlarmClock, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Application, ApplicationStatus } from "@/lib/types";

export const STATUSES: ApplicationStatus[] = ["planned", "applied", "interview", "offer", "rejected"];

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  planned: "#64748b",
  applied: "#6366f1",
  interview: "#f59e0b",
  offer: "#22c55e",
  rejected: "#ef4444",
};

/** Is a next-action due date today or in the past? */
export function isDue(when: string): boolean {
  return new Date(when).getTime() <= Date.now();
}

/** Compact "what · date" chip shown wherever the application appears. */
export function NextActionChip({ app }: { app: Application }) {
  if (!app.nextAction) return null;
  const due = isDue(app.nextAction.when);
  return (
    <span
      data-testid={`next-chip-${app.id}`}
      title={due ? "Due — do this now" : "Upcoming next step"}
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${
        due
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      }`}
    >
      <AlarmClock className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[10rem]">{app.nextAction.what}</span>
      · {new Date(app.nextAction.when).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
    </span>
  );
}

// The single next step for this application, with a due date the row surfaces.
export function NextActionEditor({ app }: { app: Application }) {
  const setNextAction = useStore((s) => s.setApplicationNextAction);
  const [what, setWhat] = useState(app.nextAction?.what ?? "");
  const [when, setWhen] = useState(app.nextAction?.when?.slice(0, 10) ?? "");

  function save() {
    if (!what.trim() || !when) {
      toast("⚠ Add both a step and a date");
      return;
    }
    setNextAction(app.id, { what: what.trim(), when });
    toast("✓ Next action set");
  }

  return (
    <div className="mb-5" data-testid={`next-action-${app.id}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        <AlarmClock className="w-3.5 h-3.5" /> Next action
      </div>
      <div className="flex flex-wrap gap-1.5">
        <input
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="Follow up with recruiter…"
          data-testid={`next-what-${app.id}`}
          className="flex-1 min-w-[10rem] px-2.5 py-1.5 rounded-lg text-xs"
        />
        <input
          type="date"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          aria-label="Due date"
          data-testid={`next-when-${app.id}`}
          className="px-2.5 py-1.5 rounded-lg text-xs"
        />
        <button type="button" onClick={save} data-testid={`next-save-${app.id}`} className="btn-primary px-3 py-1.5 rounded-lg text-xs">
          Set
        </button>
        {app.nextAction ? (
          <button
            type="button"
            onClick={() => { setNextAction(app.id, null); setWhat(""); setWhen(""); toast("✓ Cleared"); }}
            data-testid={`next-clear-${app.id}`}
            className="btn-ghost px-2.5 py-1.5 rounded-lg text-xs"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

// People attached to this application — recruiter, referral, interviewer.
export function ContactsPanel({ app }: { app: Application }) {
  const addContact = useStore((s) => s.addApplicationContact);
  const removeContact = useStore((s) => s.removeApplicationContact);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const contacts = app.contacts ?? [];

  function add() {
    if (!name.trim()) {
      toast("⚠ A name is required");
      return;
    }
    addContact(app.id, {
      name: name.trim(),
      role: role.trim() || undefined,
      email: email.trim() || undefined,
    });
    setName(""); setRole(""); setEmail("");
    toast("✓ Contact added");
  }

  return (
    <div data-testid={`contacts-${app.id}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        <Users className="w-3.5 h-3.5" /> Contacts ({contacts.length})
      </div>
      {contacts.length ? (
        <ul className="space-y-1.5 mb-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              data-testid={`contact-${c.id}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
              {c.role ? <span className="text-slate-500 dark:text-slate-400">· {c.role}</span> : null}
              {c.email ? (
                <a href={`mailto:${c.email}`} className="text-[var(--brand)] hover:underline truncate">
                  {c.email}
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => { removeContact(app.id, c.id); toast("✓ Contact removed"); }}
                aria-label={`Remove ${c.name}`}
                className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-slate-400 mb-2">
          No contacts yet — recruiters, referrals, and interviewers live here.
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" data-testid={`contact-name-${app.id}`} className="flex-1 min-w-[7rem] px-2.5 py-1.5 rounded-lg text-xs" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" data-testid={`contact-role-${app.id}`} className="w-28 px-2.5 py-1.5 rounded-lg text-xs" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" data-testid={`contact-email-${app.id}`} className="w-40 px-2.5 py-1.5 rounded-lg text-xs" />
        <button type="button" onClick={add} data-testid={`contact-add-${app.id}`} className="btn-ghost px-2.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </div>
  );
}

export function ScoreTrend({ history }: { history: { at: string; score: number }[] }) {
  if (!history.length) return null;
  const latest = history[history.length - 1];
  const color = (s: number) => (s >= 75 ? "text-green-600 dark:text-green-400" : s >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400");
  return (
    <div className="mb-4" data-testid="score-trend">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        Match rate trend
      </div>
      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        {history.map((h, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 ? <span className="text-slate-400" aria-hidden>→</span> : null}
            <span
              title={new Date(h.at).toLocaleString("en-GB")}
              className={`font-semibold tabular-nums ${i === history.length - 1 ? color(h.score) : "text-slate-500 dark:text-slate-400"}`}
            >
              {h.score}%
            </span>
          </span>
        ))}
        {history.length > 1 ? (
          <span className={`text-xs font-medium ml-1 ${color(latest.score)}`}>
            ({latest.score - history[0].score >= 0 ? "+" : ""}{latest.score - history[0].score} since first save)
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Timeline({ app }: { app: Application }) {
  const events = app.statusHistory?.length
    ? app.statusHistory
    : [{ status: app.status, at: app.createdAt }];

  return (
    <div data-testid={`timeline-${app.id}`}>
      <ScoreTrend history={app.scoreHistory ?? []} />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        <Clock className="w-3.5 h-3.5" /> Status timeline
      </div>
      <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-4">
        {events.map((e, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ml-4"
          >
            <span
              className="absolute -left-[7px] w-3 h-3 rounded-full ring-4 ring-slate-50 dark:ring-slate-900/40"
              style={{ background: STATUS_COLOR[e.status] }}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`status-pill status-${e.status}`}>
                {e.status[0].toUpperCase() + e.status.slice(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(e.at).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </motion.li>
        ))}
      </ol>
      <NotesEditor app={app} />
    </div>
  );
}

export function NotesEditor({ app }: { app: Application }) {
  const updateNotes = useStore((s) => s.updateApplicationNotes);
  const [value, setValue] = useState(app.notes ?? "");
  const dirty = value !== (app.notes ?? "");
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        Edit notes
      </div>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        data-testid={`notes-input-${app.id}`}
        placeholder="Add private notes — recruiter name, salary, next steps…"
        className="w-full px-3 py-2 rounded-lg text-xs"
      />
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => { updateNotes(app.id, value.trim()); toast("✓ Notes saved"); }}
          data-testid={`notes-save-${app.id}`}
          className="btn-primary px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
        >
          Save notes
        </button>
        {dirty ? <span className="text-[11px] text-amber-600 dark:text-amber-400">Unsaved changes</span> : null}
      </div>
    </div>
  );
}
