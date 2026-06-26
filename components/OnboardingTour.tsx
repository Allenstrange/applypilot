"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { Sparkles, ArrowRight, ArrowLeft, X, FileUp, Compass } from "lucide-react";

interface Step {
  selector: string;
  route: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="/app/profile"]',
    route: "/app/profile",
    title: "1 · Build your Master Profile",
    body: "Your single source of truth. Fill it in once (or import a CV) — every tailored resume and cover letter is generated from here.",
  },
  {
    selector: '[data-tour="/app/analyze"]',
    route: "/app/analyze",
    title: "2 · Analyse a job",
    body: "Paste a job description (or a posting URL) to instantly see your match score, matched skills and ATS gaps.",
  },
  {
    selector: '[data-tour="/app/match"]',
    route: "/app/match",
    title: "3 · Match many jobs at once",
    body: "Rank multiple roles by fit, then one-click ‘Tailor CV’ to generate and track a resume per job.",
  },
  {
    selector: '[data-tour="/app/editor"]',
    route: "/app/editor",
    title: "4 · The Editing Room",
    body: "AI-tailor your CV, cover letter, interview prep and outreach — with a live resume score and inline keyword gaps.",
  },
  {
    selector: '[data-tour="/app/resumes"]',
    route: "/app/resumes",
    title: "5 · Your resume library",
    body: "Keep multiple versions, pick from 6 templates, choose accent colours, reorder sections and edit text right on the preview.",
  },
  {
    selector: '[data-tour="/app/tracker"]',
    route: "/app/tracker",
    title: "6 · Track every application",
    body: "Switch between a table and a drag-and-drop kanban board, link the resume you used, and add notes & follow-ups.",
  },
  {
    selector: '[data-tour="/app/insights"]',
    route: "/app/insights",
    title: "7 · Insights & analytics",
    body: "See your conversion funnel, response times and which resume performs best. That’s it — you’re ready to fly! ✈️",
  },
];

export default function OnboardingTour() {
  const hydrated = useHydrated();
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const profile = useStore((s) => s.profile);
  const resumes = useStore((s) => s.resumes);
  const applications = useStore((s) => s.applications);

  const [phase, setPhase] = useState<"welcome" | "tour" | null>(null);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const isFresh = !profile.name && resumes.length === 0 && applications.length === 0;

  // Auto-show the welcome for brand-new users, once, after hydration.
  useEffect(() => {
    // Show the welcome once, after hydration, for brand-new users.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hydrated && !onboarded && isFresh) setPhase("welcome");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Allow manual restart from anywhere (sidebar "Take a tour").
  useEffect(() => {
    const h = () => {
      setStep(0);
      setPhase("welcome");
    };
    window.addEventListener("applypilot:start-tour", h);
    return () => window.removeEventListener("applypilot:start-tour", h);
  }, []);

  const measure = useCallback(() => {
    const el = document.querySelector(STEPS[step]?.selector ?? "");
    const r = el?.getBoundingClientRect() ?? null;
    setRect(r && r.width > 0 ? r : null);
  }, [step]);

  // After a step change, navigate to its route and poll for the target rect.
  useEffect(() => {
    if (phase !== "tour") return;
    let tries = 0;
    let timer: number;
    const tick = () => {
      measure();
      tries += 1;
      if (tries < 25) timer = window.setTimeout(tick, 90);
    };
    tick();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [phase, step, measure]);

  function startTour() {
    setStep(0);
    setPhase("tour");
    router.push(STEPS[0].route);
  }
  function go(i: number) {
    setStep(i);
    router.push(STEPS[i].route);
  }
  function finish() {
    setPhase(null);
    setStep(0);
    setOnboarded(true);
  }

  if (phase === "welcome") {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" data-testid="onboarding-welcome">
        <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-violet-600 to-violet-500 p-6 text-white">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Welcome to ApplyPilot</h2>
            <p className="text-sm text-white/90 mt-1">Your AI co-pilot for landing the job. Let’s get you set up in 30 seconds.</p>
          </div>
          <div className="p-5 space-y-2.5">
            <button
              type="button"
              onClick={startTour}
              data-testid="tour-start"
              className="btn-primary w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" /> Take the 30-second tour
            </button>
            <button
              type="button"
              onClick={() => { setOnboarded(true); setPhase(null); router.push("/app/profile"); }}
              data-testid="tour-import"
              className="btn-ghost w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <FileUp className="w-4 h-4" /> Jump in — build my profile
            </button>
            <button
              type="button"
              onClick={finish}
              data-testid="tour-skip"
              className="w-full px-4 py-2 rounded-xl text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "tour") {
    const s = STEPS[step];
    const last = step === STEPS.length - 1;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const ttWidth = 320;
    const ttLeft = rect
      ? Math.min(rect.right + 16, vw - ttWidth - 16)
      : Math.max(16, vw / 2 - ttWidth / 2);
    const ttTop = rect ? Math.min(Math.max(rect.top - 8, 16), vh - 250) : vh / 2 - 120;

    return (
      <div className="fixed inset-0 z-[70]" data-testid="onboarding-tour">
        {rect ? (
          <div
            className="pointer-events-none"
            style={{
              position: "fixed",
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              borderRadius: 12,
              boxShadow: "0 0 0 9999px rgba(15,23,42,0.65)",
              transition: "all 0.25s ease",
            }}
          />
        ) : (
          <div className="fixed inset-0 bg-slate-900/65" />
        )}

        <div
          className="fixed z-[71] rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-4"
          style={{ width: ttWidth, top: ttTop, left: ttLeft }}
          data-testid="tour-tooltip"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Step {step + 1} of {STEPS.length}
            </span>
            <button type="button" onClick={finish} data-testid="tour-close" aria-label="End tour" className="text-[var(--text-faint)] hover:text-[var(--text-muted)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-bold text-[var(--text)] mb-1">{s.title}</h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.body}</p>

          <div className="flex items-center gap-1 mt-4 mb-3">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-violet-500" : "w-1.5 bg-slate-300 dark:bg-slate-600"}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={finish} className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]">
              Skip
            </button>
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button type="button" onClick={() => go(step - 1)} data-testid="tour-back" className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => (last ? finish() : go(step + 1))}
                data-testid="tour-next"
                className="btn-primary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                {last ? "Finish" : "Next"} {last ? null : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
