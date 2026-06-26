import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ShieldCheck, ChevronDown } from "lucide-react";
import { FEATURES, STEPS, STATS, FAQS } from "@/components/marketing/content";
import SectionHeading from "@/components/marketing/SectionHeading";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-grid relative overflow-hidden border-b border-slate-200 dark:border-slate-700">
        <div className="blob bg-[#7c3aed] w-[28rem] h-[28rem] -top-32 -left-24 dark:opacity-40" />
        <div className="blob bg-[#fb6f4c] w-[24rem] h-[24rem] top-10 -right-20 dark:opacity-30" style={{ animationDelay: "-6s" }} />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 mb-6 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)]" />
              No sign-up · runs in your browser
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] dark:text-slate-100 text-balance">
              Land more interviews with <span className="text-[var(--brand)]">tailored</span> applications
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 dark:text-slate-300">
              ApplyPilot turns one job description into a tailored CV, a cover
              letter, interview prep, and recruiter outreach — keyword-matched and
              ATS-checked, in minutes instead of hours.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link href="/app" className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                Launch the app <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/how-it-works" className="btn-ghost px-6 py-3 rounded-lg text-sm font-semibold">
                See how it works
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {["Free & local", "Your own AI keys", "Export to PDF"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: framed product screenshot */}
          <div className="lg:[perspective:1600px]">
            <div className="app-frame lg:[transform:rotateY(-9deg)_rotateX(3deg)] lg:hover:[transform:rotateY(-4deg)_rotateX(1deg)] transition-transform duration-500">
              <div className="app-frame-bar">
                <span className="app-frame-dot bg-[#ff5f57]" />
                <span className="app-frame-dot bg-[#febc2e]" />
                <span className="app-frame-dot bg-[#28c840]" />
                <span className="ml-3 text-[11px] text-[var(--text-faint)] truncate">app.applypilot — Resume editor</span>
              </div>
              <Image
                src="/hero-shot.png"
                alt="ApplyPilot resume editor showing template switching, a resume score, and live preview"
                width={1360}
                height={880}
                priority
                className="block w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-16">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          title="The whole application loop, automated"
          subtitle="The best parts of JobScan, Teal, Rezi and Kickresume — without juggling five different tabs."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4 dark:bg-violet-950/40">
                <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5 dark:text-slate-100">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — a connected sequence, not another card grid */}
      <section className="bg-slate-50 border-y border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeading
            title="From job description to ready-to-send"
            subtitle="Four steps. No copy-pasting between tools."
          />
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.n} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden lg:block absolute top-5 left-[3.25rem] right-[-1.5rem] h-px bg-[var(--border-strong)]"
                  />
                ) : null}
                <span className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-white font-bold ring-4 ring-slate-50 dark:ring-slate-800/50">
                  {s.n}
                </span>
                <h3 className="mt-5 font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed dark:text-slate-300">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHeading title="Questions, answered" />
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="card rounded-xl p-5 group">
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-semibold text-slate-900 dark:text-slate-100 list-none">
                  {f.q}
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#6d28d9] via-[#a855f7] to-[#fb6f4c] px-8 py-16 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">Stop rewriting from scratch</h2>
          <p className="mt-3 text-violet-50 max-w-xl mx-auto">
            Bring your own AI key and tailor your next application in minutes.
            Everything stays in your browser.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors dark:bg-slate-900 dark:text-violet-300"
          >
            Launch the app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
