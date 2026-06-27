"use client";

import { useRef, useState } from "react";
import { Upload, Download, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAIConfigured } from "@/lib/ai";
import { parseCVFile, mergeProfiles, type ApplyMode } from "@/lib/cvParser";
import { downloadJSON } from "@/lib/download";
import { toast } from "@/lib/toast";
import type { Profile, Experience, Education } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import LiveCoach from "@/components/LiveCoach";

const newExperience = (): Experience => ({
  company: "",
  role: "",
  start: "",
  end: "",
  bullets: "",
  tools: "",
});
const newEducation = (): Education => ({ institution: "", degree: "", year: "" });

type StatusKind = "idle" | "working" | "ok" | "error";
type TextKey = Extract<
  keyof Profile,
  | "name"
  | "title"
  | "email"
  | "phone"
  | "location"
  | "linkedin"
  | "summary"
  | "skills"
  | "certs"
>;

export default function ProfilePage() {
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const replaceProfile = useStore((s) => s.replaceProfile);
  const providers = useStore((s) => s.providers);

  const [status, setStatus] = useState<{ kind: StatusKind; msg: string }>({
    kind: "idle",
    msg: "",
  });
  const [pending, setPending] = useState<Profile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!hydrated) {
    return (
      <div className="p-8">
        <PageHeader title="Master Profile" subtitle="Loading…" />
      </div>
    );
  }

  // ---- field binding helpers ----
  const text = (key: TextKey) => ({
    value: profile[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setProfile({ [key]: e.target.value }),
  });

  const updateExp = (i: number, patch: Partial<Experience>) =>
    setProfile({
      experience: profile.experience.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e,
      ),
    });
  const addExp = () =>
    setProfile({ experience: [...profile.experience, newExperience()] });
  const removeExp = (i: number) =>
    setProfile({ experience: profile.experience.filter((_, idx) => idx !== i) });

  const updateEdu = (i: number, patch: Partial<Education>) =>
    setProfile({
      education: profile.education.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e,
      ),
    });
  const addEdu = () =>
    setProfile({ education: [...profile.education, newEducation()] });
  const removeEdu = (i: number) =>
    setProfile({ education: profile.education.filter((_, idx) => idx !== i) });

  // ---- CV import ----
  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ kind: "error", msg: "File too large (max 10MB)" });
      return;
    }
    const ai = isAIConfigured(providers);
    setStatus({
      kind: "working",
      msg: ai ? `AI extracting from ${file.name}…` : `Reading ${file.name}…`,
    });
    try {
      const { profile: parsed, source } = await parseCVFile(file, providers, ai);
      setPending(parsed);
      const found: string[] = [];
      if (parsed.name) found.push("name");
      if (parsed.email) found.push("email");
      if (parsed.skills) found.push("skills");
      if (parsed.experience.length)
        found.push(`${parsed.experience.length} roles`);
      const note =
        source === "local" ? " — configure an AI provider for full extraction" : "";
      setStatus({
        kind: "ok",
        msg: `Parsed ${file.name}. Found: ${
          found.length ? found.join(", ") : "no recognised fields"
        }${note}`,
      });
    } catch (err) {
      setStatus({ kind: "error", msg: (err as Error).message });
    }
  }

  function applyParsed(mode: ApplyMode) {
    if (!pending) return;
    replaceProfile(mode === "overwrite" ? pending : mergeProfiles(profile, pending));
    setPending(null);
    setStatus({ kind: "idle", msg: "" });
    toast(mode === "overwrite" ? "✓ Profile replaced" : "✓ Profile updated");
  }

  function exportJSON() {
    downloadJSON("master_profile.json", profile);
    toast("✓ Profile exported as JSON");
  }

  const statusColor =
    status.kind === "error"
      ? "text-red-600"
      : status.kind === "ok"
        ? "text-green-600"
        : "text-amber-600";

  return (
    <div className="p-8">
      <PageHeader
        title="Master Profile"
        subtitle="Your baseline CV data, used to tailor every application truthfully."
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
      {/* ---- CV import ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Upload className="w-4 h-4" /> Auto-Import from CV
            </h2>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
              Upload your CV. Uses AI if configured. Supports DOCX, PDF, JSON, TXT.
            </p>
          </div>
          <button
            type="button"
            onClick={exportJSON}
            className="btn-ghost px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Export JSON
          </button>
        </div>

        <div
          className={`dropzone p-8 text-center ${dragOver ? "dragover" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".docx,.pdf,.json,.txt"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="text-4xl mb-2">📎</div>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            Drop your CV here or click to browse
          </div>
          <div className="text-xs text-slate-500 mt-2 dark:text-slate-400">
            Accepted: .docx .pdf .json .txt (max 10MB)
          </div>
          {status.msg ? (
            <div className={`mt-3 text-sm ${statusColor}`}>
              {status.kind === "working" ? <span className="spinner" /> : null}
              {status.msg}
            </div>
          ) : null}
        </div>

        {pending ? (
          <div className="mt-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-amber-600 font-semibold text-sm mb-3 dark:text-amber-400">
                How should this data be applied?
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyParsed("overwrite")}
                  className="btn-primary px-4 py-2 rounded-lg text-xs font-medium"
                >
                  Replace current profile
                </button>
                <button
                  type="button"
                  onClick={() => applyParsed("merge")}
                  className="btn-ghost px-4 py-2 rounded-lg text-xs font-medium"
                >
                  Fill blank fields only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setStatus({ kind: "idle", msg: "" });
                  }}
                  className="btn-ghost px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---- Personal details ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Personal Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Labeled label="Full Name">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="John Smith" {...text("name")} />
          </Labeled>
          <Labeled label="Professional Title">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="IT Support Analyst" {...text("title")} />
          </Labeled>
          <Labeled label="Email">
            <input type="email" className="w-full px-3 py-2 rounded-lg text-sm" placeholder="you@example.com" {...text("email")} />
          </Labeled>
          <Labeled label="Phone">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="+44 7700 900000" {...text("phone")} />
          </Labeled>
          <Labeled label="Location">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Birmingham, UK" {...text("location")} />
          </Labeled>
          <Labeled label="LinkedIn URL">
            <input className="w-full px-3 py-2 rounded-lg text-sm" placeholder="linkedin.com/in/you" {...text("linkedin")} />
          </Labeled>
        </div>
      </div>

      {/* ---- Summary ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Professional Summary</h2>
        <textarea
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-sm"
          placeholder="A brief 3-4 line summary of your experience and strengths…"
          {...text("summary")}
        />
      </div>

      {/* ---- Skills ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1 dark:text-slate-100">Skills &amp; Tools</h2>
        <p className="text-xs text-slate-500 mb-3 dark:text-slate-400">
          Comma-separated. Used for keyword matching.
        </p>
        <textarea
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm"
          placeholder="Active Directory, Azure AD, Office 365, PowerShell, TCP/IP, DNS"
          {...text("skills")}
        />
      </div>

      {/* ---- Experience ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Work Experience</h2>
          <button
            type="button"
            onClick={addExp}
            className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Role
          </button>
        </div>
        <div className="space-y-4">
          {profile.experience.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4 dark:text-slate-400">
              No experience added yet.
            </div>
          ) : (
            profile.experience.map((exp, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Role #{i + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeExp(i)}
                    className="text-red-600 text-xs hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input className="px-3 py-2 rounded-lg text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateExp(i, { company: e.target.value })} />
                  <input className="px-3 py-2 rounded-lg text-sm" placeholder="Role title" value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
                  <input className="px-3 py-2 rounded-lg text-sm" placeholder="Start" value={exp.start} onChange={(e) => updateExp(i, { start: e.target.value })} />
                  <input className="px-3 py-2 rounded-lg text-sm" placeholder="End" value={exp.end} onChange={(e) => updateExp(i, { end: e.target.value })} />
                </div>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                  placeholder="Key responsibilities (one per line)"
                  value={exp.bullets}
                  onChange={(e) => updateExp(i, { bullets: e.target.value })}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  placeholder="Tools used (comma separated)"
                  value={exp.tools}
                  onChange={(e) => updateExp(i, { tools: e.target.value })}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---- Education ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Education</h2>
          <button
            type="button"
            onClick={addEdu}
            className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Education
          </button>
        </div>
        <div className="space-y-3">
          {profile.education.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4 dark:text-slate-400">
              No education added yet.
            </div>
          ) : (
            profile.education.map((ed, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <input className="sm:col-span-2 px-3 py-2 rounded-lg text-sm" placeholder="Institution" value={ed.institution} onChange={(e) => updateEdu(i, { institution: e.target.value })} />
                <input className="px-3 py-2 rounded-lg text-sm" placeholder="Degree" value={ed.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} />
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded-lg text-sm" placeholder="Year" value={ed.year} onChange={(e) => updateEdu(i, { year: e.target.value })} />
                  <button type="button" onClick={() => removeEdu(i)} className="text-red-600 text-xs px-2 dark:text-red-400" aria-label="Remove education">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---- Certifications ---- */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Certifications</h2>
        <textarea
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm"
          placeholder="One per line: CompTIA A+, Microsoft MD-102, ITIL Foundation"
          {...text("certs")}
        />
      </div>

      <p className="text-xs text-slate-500 text-right dark:text-slate-400">
        Changes save automatically to this browser.
      </p>
        </div>

        <aside className="lg:col-span-1 order-first lg:order-none">
          <div className="lg:sticky lg:top-6">
            <LiveCoach profile={profile} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
