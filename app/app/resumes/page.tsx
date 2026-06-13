"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, Copy, Trash2, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { scoreResume } from "@/lib/resumeScore";
import { getTemplate } from "@/lib/templates";
import { toast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";

export default function ResumesPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const resumes = useStore((s) => s.resumes);
  const profile = useStore((s) => s.profile);
  const addResume = useStore((s) => s.addResume);
  const duplicateResume = useStore((s) => s.duplicateResume);
  const removeResume = useStore((s) => s.removeResume);

  function createFromProfile() {
    const copy = JSON.parse(JSON.stringify(profile));
    const name = profile.name ? `${profile.name.split(" ")[0]}'s Resume` : "My Resume";
    const id = addResume(name, "classic", copy);
    router.push(`/app/resumes/${id}`);
  }

  const list = hydrated ? resumes : [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <PageHeader title="Resumes" subtitle="Build and keep multiple tailored resume versions." />
        <button type="button" onClick={createFromProfile} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <FilePlus2 className="w-4 h-4" /> New resume
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card rounded-xl p-12 text-center text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div>No resumes yet.</div>
          <p className="text-sm mt-1">
            Create one from your{" "}
            <Link href="/app/profile" className="text-indigo-600 underline">master profile</Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const score = scoreResume(r.profile).overall;
            const tpl = getTemplate(r.templateId);
            const scoreColor = score >= 80 ? "text-green-600" : score >= 55 ? "text-amber-600" : "text-red-600";
            return (
              <div key={r.id} className="card rounded-xl p-5 flex flex-col">
                <Link href={`/app/resumes/${r.id}`} className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100">
                      <span className="w-2 h-2 rounded-full" style={{ background: tpl.accent }} />
                      {tpl.name}
                    </span>
                    <span>· {new Date(r.updatedAt).toLocaleDateString("en-GB")}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200">
                  <Link href={`/app/resumes/${r.id}`} className="text-indigo-600 text-xs font-medium hover:text-indigo-700">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => { const id = duplicateResume(r.id); if (id) toast("✓ Duplicated"); }}
                    className="text-slate-500 text-xs hover:text-slate-700 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeResume(r.id); toast("✓ Deleted"); }}
                    className="text-red-600 text-xs hover:text-red-700 flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
