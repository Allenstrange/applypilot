"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Send, Check, Undo2, X, Settings2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { isAIConfigured } from "@/lib/ai";
import { assistantEditResume } from "@/lib/generate";
import { applyEdit, previewEdit, editTarget } from "@/lib/resumeEdits";
import { scoreResume } from "@/lib/resumeScore";
import { toast } from "@/lib/toast";
import type { AssistantMessage, Profile, ResumeEdit } from "@/lib/types";

const QUICK_ACTIONS = [
  "Make my summary more senior",
  "Quantify my bullets",
  "Tighten everything",
  "Tailor this to the job",
];

export default function ResumeAssistant({
  variant = "tab",
  onClose,
}: {
  variant?: "tab" | "drawer";
  onClose?: () => void;
}) {
  const draftCV = useStore((s) => s.draftCV);
  const analysis = useStore((s) => s.currentAnalysis);
  const providers = useStore((s) => s.providers);
  const setDraftCV = useStore((s) => s.setDraftCV);
  const reduce = useReducedMotion();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // editId -> snapshot of the draft taken just before the edit was applied.
  const [snapshots, setSnapshots] = useState<Record<string, Profile>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const configured = isAIConfigured(providers);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, busy, reduce]);

  if (!draftCV) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    if (!configured) {
      toast("⚠ AI provider not configured");
      return;
    }
    const userMsg: AssistantMessage = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      const { reply, edits } = await assistantEditResume(history, draftCV!, analysis, providers);
      setMessages((m) => [...m, { role: "assistant", content: reply, edits }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "✕ " + (err as Error).message },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function apply(edit: ResumeEdit) {
    const current = useStore.getState().draftCV;
    if (!current) return;
    const before = scoreResume(current).overall;
    setSnapshots((s) => ({ ...s, [edit.id]: current }));
    const next = applyEdit(current, edit);
    setDraftCV(next);
    const after = scoreResume(next).overall;
    toast(after !== before ? `✓ Applied · score ${before}→${after}` : "✓ Applied");
  }

  function undo(edit: ResumeEdit) {
    const snap = snapshots[edit.id];
    if (snap) setDraftCV(snap);
    setSnapshots((s) => {
      const next = { ...s };
      delete next[edit.id];
      return next;
    });
    toast("↩ Reverted");
  }

  const empty = messages.length === 0;

  return (
    <div className={`flex flex-col ${variant === "drawer" ? "h-full" : "h-[calc(100vh-16rem)] min-h-[28rem] rounded-2xl border border-[var(--border)] bg-[var(--surface)]"}`}>
      {/* Header (drawer only — the tab has the page's own heading) */}
      {variant === "drawer" ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-[var(--brand)]" /> Résumé Assistant
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Close assistant" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-11 h-11 rounded-2xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              How can I help with your résumé?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Ask in plain language. I’ll reply and propose edits you can apply or dismiss.
              {analysis ? ` Tuned to ${analysis.title} at ${analysis.company}.` : ""}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={busy}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-slate-600 dark:text-slate-300 hover:border-[var(--brand)]/50 hover:text-[var(--brand)] transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--brand)] text-white dark:text-slate-900 px-3.5 py-2 text-sm">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="space-y-2.5">
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200">
                      {m.content}
                    </div>
                  </div>
                  {(m.edits ?? [])
                    .filter((e) => !dismissed.has(e.id))
                    .map((e) => (
                      <EditCard
                        key={e.id}
                        edit={e}
                        profile={draftCV!}
                        applied={!!snapshots[e.id]}
                        onApply={() => apply(e)}
                        onUndo={() => undo(e)}
                        onDismiss={() => setDismissed((d) => new Set(d).add(e.id))}
                      />
                    ))}
                </div>
              ),
            )}
            {busy ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="spinner" /> Thinking…
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border)] p-3">
        {!configured ? (
          <Link
            href="/app/settings"
            className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2 hover:underline"
          >
            <Settings2 className="w-3.5 h-3.5" /> Connect an AI provider to chat
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : null}
        {!empty ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={busy}
                className="text-[11px] px-2 py-1 rounded-full border border-[var(--border)] text-slate-500 dark:text-slate-400 hover:border-[var(--brand)]/50 hover:text-[var(--brand)] transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Describe a change… (e.g. “quantify my bullets”)"
            aria-label="Message the résumé assistant"
            data-testid="assistant-input"
            className="flex-1 resize-none px-3 py-2 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] max-h-32"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send"
            data-testid="assistant-send"
            className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
          >
            {busy ? <span className="spinner" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
          Each message uses one AI call on your own key.
        </div>
      </div>
    </div>
  );
}

function EditCard({
  edit,
  profile,
  applied,
  onApply,
  onUndo,
  onDismiss,
}: {
  edit: ResumeEdit;
  profile: Profile;
  applied: boolean;
  onApply: () => void;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();
  const { before, after } = previewEdit(profile, edit);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      data-testid="assistant-edit-card"
      className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 ml-1"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {editTarget(profile, edit)}
        </span>
        {edit.rationale ? (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate ml-2">{edit.rationale}</span>
        ) : null}
      </div>
      {before ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 line-through decoration-slate-300/60 mb-1">
          {before}
        </p>
      ) : null}
      <p className="text-xs text-slate-800 dark:text-slate-100">{after}</p>
      <div className="flex items-center gap-2 mt-2.5">
        {applied ? (
          <>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
              <Check className="w-3 h-3" /> Applied
            </span>
            <button
              type="button"
              onClick={onUndo}
              data-testid="assistant-edit-undo"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <Undo2 className="w-3 h-3" /> Undo
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onApply}
              data-testid="assistant-edit-apply"
              className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--brand)] text-white dark:text-slate-900 font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
