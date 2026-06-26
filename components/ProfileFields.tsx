"use client";

import { Plus, X } from "lucide-react";
import type { Profile, Experience, Education } from "@/lib/types";

const newExperience = (): Experience => ({
  company: "",
  role: "",
  start: "",
  end: "",
  bullets: "",
  tools: "",
});
const newEducation = (): Education => ({ institution: "", degree: "", year: "" });

type TextKey = Extract<
  keyof Profile,
  "name" | "title" | "email" | "phone" | "location" | "linkedin" | "summary" | "skills" | "certs"
>;

export default function ProfileFields({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (patch: Partial<Profile>) => void;
}) {
  const text = (key: TextKey) => ({
    value: profile[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onPatch({ [key]: e.target.value }),
  });

  const updateExp = (i: number, patch: Partial<Experience>) =>
    onPatch({
      experience: profile.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  const addExp = () => onPatch({ experience: [...profile.experience, newExperience()] });
  const removeExp = (i: number) =>
    onPatch({ experience: profile.experience.filter((_, idx) => idx !== i) });

  const updateEdu = (i: number, patch: Partial<Education>) =>
    onPatch({
      education: profile.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  const addEdu = () => onPatch({ education: [...profile.education, newEducation()] });
  const removeEdu = (i: number) =>
    onPatch({ education: profile.education.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="card rounded-xl p-6">
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

      <div className="card rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Professional Summary</h2>
        <textarea rows={4} className="w-full px-3 py-2 rounded-lg text-sm" placeholder="A brief 3-4 line summary…" {...text("summary")} />
      </div>

      <div className="card rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-1 dark:text-slate-100">Skills &amp; Tools</h2>
        <p className="text-xs text-slate-500 mb-3 dark:text-slate-400">Comma-separated. Used for keyword matching.</p>
        <textarea rows={3} className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Active Directory, Azure AD, Office 365, PowerShell…" {...text("skills")} />
      </div>

      <div className="card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Work Experience</h2>
          <button type="button" onClick={addExp} className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Role
          </button>
        </div>
        <div className="space-y-4">
          {profile.experience.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4 dark:text-slate-400">No experience added yet.</div>
          ) : (
            profile.experience.map((exp, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Role #{i + 1}</div>
                  <button type="button" onClick={() => removeExp(i)} className="text-red-600 text-xs hover:text-red-700 dark:text-red-400">Remove</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input aria-label={`Company for role ${i + 1}`} className="px-3 py-2 rounded-lg text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateExp(i, { company: e.target.value })} />
                  <input aria-label={`Role title ${i + 1}`} className="px-3 py-2 rounded-lg text-sm" placeholder="Role title" value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
                  <input aria-label={`Start date for role ${i + 1}`} className="px-3 py-2 rounded-lg text-sm" placeholder="Start" value={exp.start} onChange={(e) => updateExp(i, { start: e.target.value })} />
                  <input aria-label={`End date for role ${i + 1}`} className="px-3 py-2 rounded-lg text-sm" placeholder="End" value={exp.end} onChange={(e) => updateExp(i, { end: e.target.value })} />
                </div>
                <textarea aria-label={`Responsibilities for role ${i + 1}`} rows={3} className="w-full px-3 py-2 rounded-lg text-sm mb-2" placeholder="Key responsibilities (one per line)" value={exp.bullets} onChange={(e) => updateExp(i, { bullets: e.target.value })} />
                <input aria-label={`Tools used for role ${i + 1}`} className="w-full px-3 py-2 rounded-lg text-sm" placeholder="Tools used (comma separated)" value={exp.tools} onChange={(e) => updateExp(i, { tools: e.target.value })} />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Education</h2>
          <button type="button" onClick={addEdu} className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Education
          </button>
        </div>
        <div className="space-y-3">
          {profile.education.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4 dark:text-slate-400">No education added yet.</div>
          ) : (
            profile.education.map((ed, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <input aria-label={`Institution ${i + 1}`} className="sm:col-span-2 px-3 py-2 rounded-lg text-sm" placeholder="Institution" value={ed.institution} onChange={(e) => updateEdu(i, { institution: e.target.value })} />
                <input aria-label={`Degree ${i + 1}`} className="px-3 py-2 rounded-lg text-sm" placeholder="Degree" value={ed.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} />
                <div className="flex gap-2">
                  <input aria-label={`Graduation year ${i + 1}`} className="flex-1 px-3 py-2 rounded-lg text-sm" placeholder="Year" value={ed.year} onChange={(e) => updateEdu(i, { year: e.target.value })} />
                  <button type="button" onClick={() => removeEdu(i)} className="text-red-600 text-xs px-2 dark:text-red-400" aria-label="Remove education">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">Certifications</h2>
        <textarea rows={2} className="w-full px-3 py-2 rounded-lg text-sm" placeholder="One per line: CompTIA A+, Microsoft MD-102, ITIL Foundation" {...text("certs")} />
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
