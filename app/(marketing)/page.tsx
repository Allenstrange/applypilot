import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { FEATURES, STEPS } from "@/components/marketing/content";
import SectionHeading from "@/components/marketing/SectionHeading";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-grid border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            No sign-up · runs in your browser
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.1]">
            Land more interviews with <span className="brand-gradient-text">tailored</span> applications
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            ApplyPilot turns one job description into a tailored CV, a cover
            letter, interview prep, and recruiter outreach — keyword-matched and
            ATS-checked, in minutes instead of hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
              Launch the app <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/how-it-works" className="btn-ghost px-6 py-3 rounded-lg text-sm font-semibold">
              See how it works
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Free & local", "Your own AI keys", "Export to PDF"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="Everything in one place"
          title="The whole application loop, automated"
          subtitle="The best parts of JobScan, Teal, Rezi and Kickresume — without juggling five different tabs."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeading
            eyebrow="How it works"
            title="From job description to ready-to-send"
            subtitle="Four steps. No copy-pasting between tools."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-16 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">Stop rewriting from scratch</h2>
          <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
            Bring your own AI key and tailor your next application in minutes.
            Everything stays in your browser.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Launch the app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
