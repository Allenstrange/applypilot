import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { FEATURES } from "@/components/marketing/content";
import SectionHeading from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "Features — ApplyPilot",
  description:
    "Job analysis, ATS scanning, CV tailoring, cover letters, resume summaries, interview prep, outreach, and an application tracker.",
};

const HIGHLIGHTS = [
  "Semantic keyword matching, not just string matching",
  "ATS safety scan flags missing sections and weak metrics",
  "Keyword highlighting across every generated document",
  "Per-bullet AI rewriting: STAR, impact, and metrics",
  "Save generations and reload them without spending tokens",
  "Export clean PDFs, JSON, and CSV",
];

export default function FeaturesPage() {
  return (
    <>
      <section className="hero-grid border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Everything you need to <span className="brand-gradient-text">apply faster</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            One tool for the entire application loop — diagnose, tailor,
            generate, and track.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeading eyebrow="Why it's different" title="Built to beat the ATS, honestly" />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
            {HIGHLIGHTS.map((h) => (
              <div key={h} className="flex items-start gap-3 card p-4">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Link href="/app" className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
          Launch the app <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </>
  );
}
