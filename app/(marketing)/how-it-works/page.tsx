import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STEPS } from "@/components/marketing/content";

export const metadata: Metadata = {
  title: "How it works — ApplyPilot",
  description:
    "Build your profile, analyse the job, tailor and generate, then track and apply — in four steps.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="hero-grid border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            From job post to <span className="text-[var(--brand)]">ready-to-send</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
            Four steps, one tool. Here&apos;s the whole flow.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <ol className="relative border-l-2 border-slate-200 ml-4 dark:border-slate-700">
          {STEPS.map((s) => (
            <li key={s.n} className="mb-10 ml-8">
              <span className="absolute -left-[1.15rem] flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white font-bold text-sm ring-4 ring-white dark:ring-slate-900">
                {s.n}
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 mt-4 dark:bg-slate-800/50 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 mb-1 dark:text-slate-100">Bring your own AI</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ApplyPilot doesn&apos;t lock you in. Add an OpenAI, Anthropic, Gemini, or
            any OpenAI-compatible key in <span className="font-medium">AI Settings</span> and
            switch models whenever you like. Your keys and data never leave your
            browser.
          </p>
        </div>

        <div className="text-center mt-12">
          <Link href="/app" className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
