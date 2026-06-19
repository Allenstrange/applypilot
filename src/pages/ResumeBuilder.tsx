import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Resume, Experience, Education } from '@/lib/types'
import { generateId, debounce, formatDate } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import ResumePreview from '@/components/ResumePreview'
import { Plus, Trash2, Download, Copy, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const BLANK_PROFILE: Profile = {
  name: '', email: '', phone: '', location: '', linkedin: '', website: '',
  summary: '', skills: [], certifications: [], experience: [], education: [],
}

const BLANK_EXP = (): Experience => ({
  id: generateId(), company: '', title: '', location: '',
  startDate: '', endDate: '', current: false, bullets: [''],
})

const BLANK_EDU = (): Education => ({
  id: generateId(), school: '', degree: '', field: '', startDate: '', endDate: '',
})

const ACCENT_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#d97706', '#059669', '#0891b2', '#1a1a1a']

export default function ResumeBuilder() {
  const { addToast } = useAppStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [active, setActive] = useState<Resume | null>(null)
  const [profile, setProfile] = useState<Profile>(BLANK_PROFILE)
  const [template, setTemplate] = useState<Resume['template']>('classic')
  const [accentColor, setAccentColor] = useState('#0d9488')
  const [title, setTitle] = useState('My Resume')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [exporting, setExporting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({ contact: true, summary: true, skills: true, experience: true, education: true })
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('resumes').select('*').order('updated_at', { ascending: false })
      .then(({ data }) => {
        const rs = (data ?? []).map(mapRow)
        setResumes(rs)
        if (rs.length > 0) loadResume(rs[0])
      })
  }, [])

  function mapRow(r: Record<string, unknown>): Resume {
    return {
      id: r.id as string, title: r.title as string,
      template: r.template as Resume['template'], accentColor: r.accent_color as string,
      profile: r.profile as Profile, targetRole: r.target_role as string | undefined,
      createdAt: r.created_at as string, updatedAt: r.updated_at as string,
    }
  }

  function loadResume(r: Resume) {
    setActive(r); setProfile(r.profile); setTemplate(r.template)
    setAccentColor(r.accentColor); setTitle(r.title); setSaveStatus('saved')
  }

  const debouncedSave = useCallback(debounce(async (r: Resume) => {
    setSaveStatus('saving')
    const { data } = await supabase.from('resumes').upsert({
      id: r.id, title: r.title, template: r.template, accent_color: r.accentColor,
      profile: r.profile, target_role: r.targetRole, updated_at: new Date().toISOString(),
    }).select().single()
    if (data) {
      const updated = mapRow(data)
      setActive(updated)
      setResumes(prev => prev.map(x => x.id === updated.id ? updated : x))
    }
    setSaveStatus('saved')
  }, 1200), [])

  function update(newProfile: Profile) {
    setProfile(newProfile)
    setSaveStatus('unsaved')
    if (active) debouncedSave({ ...active, profile: newProfile, template, accentColor, title })
  }

  async function newResume() {
    const r: Resume = {
      id: generateId(), title: 'Untitled Resume', template: 'classic',
      accentColor: '#0d9488', profile: BLANK_PROFILE,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const { data } = await supabase.from('resumes').insert({
      id: r.id, title: r.title, template: r.template, accent_color: r.accentColor,
      profile: r.profile, created_at: r.createdAt, updated_at: r.updatedAt,
    }).select().single()
    if (data) {
      const saved = mapRow(data)
      setResumes(prev => [saved, ...prev])
      loadResume(saved)
    }
  }

  async function cloneResume(r: Resume) {
    const clone = { ...r, id: generateId(), title: `${r.title} (copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const { data } = await supabase.from('resumes').insert({
      id: clone.id, title: clone.title, template: clone.template, accent_color: clone.accentColor,
      profile: clone.profile, created_at: clone.createdAt, updated_at: clone.updatedAt,
    }).select().single()
    if (data) setResumes(prev => [mapRow(data), ...prev])
    addToast('Resume cloned', 'success')
  }

  async function deleteResume(id: string) {
    await supabase.from('resumes').delete().eq('id', id)
    const remaining = resumes.filter(r => r.id !== id)
    setResumes(remaining)
    if (active?.id === id) { if (remaining.length > 0) loadResume(remaining[0]); else { setActive(null); setProfile(BLANK_PROFILE) } }
  }

  async function exportPDF() {
    const el = document.getElementById('resume-preview')
    if (!el) return
    setExporting(true)
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/png')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height / canvas.width) * pdfW
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`)
      addToast('PDF exported', 'success')
    } catch {
      addToast('Export failed', 'error')
    }
    setExporting(false)
  }

  function addExp() { update({ ...profile, experience: [...(profile.experience ?? []), BLANK_EXP()] }) }
  function removeExp(id: string) { update({ ...profile, experience: profile.experience.filter(e => e.id !== id) }) }
  function updateExp(id: string, field: keyof Experience, val: unknown) {
    update({ ...profile, experience: profile.experience.map(e => e.id === id ? { ...e, [field]: val } : e) })
  }

  function addEdu() { update({ ...profile, education: [...(profile.education ?? []), BLANK_EDU()] }) }
  function removeEdu(id: string) { update({ ...profile, education: profile.education.filter(e => e.id !== id) }) }
  function updateEdu(id: string, field: keyof Education, val: string) {
    update({ ...profile, education: profile.education.map(e => e.id === id ? { ...e, [field]: val } : e) })
  }

  function toggle(s: keyof typeof expandedSections) { setExpandedSections(prev => ({ ...prev, [s]: !prev[s] })) }

  const inp = 'w-full'

  function Section({ title: t, skey, children }: { title: string; skey: keyof typeof expandedSections; children: React.ReactNode }) {
    return (
      <div className="border border-navy-700 rounded-xl overflow-hidden mb-3">
        <button onClick={() => toggle(skey)} className="w-full flex items-center justify-between px-4 py-3 bg-navy-800 text-sm font-medium text-slate-200 hover:bg-navy-700 transition-colors">
          {t}
          {expandedSections[skey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections[skey] && <div className="p-4 bg-navy-900">{children}</div>}
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: editor */}
      <div className="w-96 flex flex-col border-r border-navy-700 flex-shrink-0">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-navy-700 bg-navy-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText size={16} className="text-teal-400 flex-shrink-0" />
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setSaveStatus('unsaved'); if (active) debouncedSave({ ...active, title: e.target.value, profile, template, accentColor }) }}
              className="bg-transparent border-0 text-sm font-medium text-slate-200 outline-none flex-1 min-w-0 p-0"
            />
          </div>
          <span className={`text-xs flex-shrink-0 ${saveStatus === 'saved' ? 'text-teal-400' : saveStatus === 'saving' ? 'text-amber-400' : 'text-slate-500'}`}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>

        {/* Template + color */}
        <div className="px-4 py-3 border-b border-navy-700 bg-navy-950 space-y-2">
          <div className="flex gap-2">
            {(['classic', 'modern', 'compact'] as const).map(t => (
              <button key={t} onClick={() => { setTemplate(t); if (active) debouncedSave({ ...active, template: t, profile, accentColor, title }) }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${ template === t ? 'bg-teal-600 text-white' : 'bg-navy-700 text-slate-400 hover:text-slate-200' }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Accent</span>
            <div className="flex gap-1">
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => { setAccentColor(c); if (active) debouncedSave({ ...active, accentColor: c, profile, template, title }) }}
                  style={{ background: c }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${ accentColor === c ? 'border-white scale-110' : 'border-transparent' }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <Section title="Contact" skey="contact">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className="form-label">Full Name</label><input className={inp} value={profile.name} onChange={e => update({ ...profile, name: e.target.value })} /></div>
              <div><label className="form-label">Email</label><input className={inp} value={profile.email} onChange={e => update({ ...profile, email: e.target.value })} /></div>
              <div><label className="form-label">Phone</label><input className={inp} value={profile.phone} onChange={e => update({ ...profile, phone: e.target.value })} /></div>
              <div><label className="form-label">Location</label><input className={inp} value={profile.location} onChange={e => update({ ...profile, location: e.target.value })} /></div>
              <div><label className="form-label">LinkedIn</label><input className={inp} value={profile.linkedin} onChange={e => update({ ...profile, linkedin: e.target.value })} /></div>
            </div>
          </Section>

          <Section title="Summary" skey="summary">
            <textarea rows={4} className={`${inp} resize-none`} value={profile.summary} onChange={e => update({ ...profile, summary: e.target.value })} placeholder="Professional summary..." />
          </Section>

          <Section title="Skills" skey="skills">
            <textarea rows={3} className={`${inp} resize-none`}
              value={profile.skills.join(', ')}
              onChange={e => update({ ...profile, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="React, TypeScript, Node.js (comma-separated)"
            />
          </Section>

          <Section title="Experience" skey="experience">
            {(profile.experience ?? []).map((exp, idx) => (
              <div key={exp.id} className="border border-navy-700 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 font-medium">Position {idx + 1}</span>
                  <button onClick={() => removeExp(exp.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="form-label">Title</label><input className={inp} value={exp.title} onChange={e => updateExp(exp.id, 'title', e.target.value)} /></div>
                    <div><label className="form-label">Company</label><input className={inp} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} /></div>
                    <div><label className="form-label">Start</label><input className={inp} value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></div>
                    <div><label className="form-label">End</label><input className={inp} value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} disabled={exp.current} placeholder="Dec 2024" /></div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, 'current', e.target.checked)} className="w-auto p-0 border-0" />
                    Current role
                  </label>
                  <div>
                    <label className="form-label">Bullet Points</label>
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-1 mb-1">
                        <input value={b} onChange={e => { const bs = [...exp.bullets]; bs[bi] = e.target.value; updateExp(exp.id, 'bullets', bs) }} className="flex-1 text-xs" placeholder="Describe an achievement..." />
                        <button onClick={() => { const bs = exp.bullets.filter((_, i) => i !== bi); updateExp(exp.id, 'bullets', bs) }} className="text-slate-600 hover:text-red-400 px-1"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <button onClick={() => updateExp(exp.id, 'bullets', [...exp.bullets, ''])} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-1">
                      <Plus size={12} /> Add bullet
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExp} className="btn-secondary w-full text-xs"><Plus size={14} /> Add Position</button>
          </Section>

          <Section title="Education" skey="education">
            {(profile.education ?? []).map((edu, idx) => (
              <div key={edu.id} className="border border-navy-700 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">School {idx + 1}</span>
                  <button onClick={() => removeEdu(edu.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2"><label className="form-label">School</label><input className={inp} value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} /></div>
                  <div><label className="form-label">Degree</label><input className={inp} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} /></div>
                  <div><label className="form-label">Field</label><input className={inp} value={edu.field} onChange={e => updateEdu(edu.id, 'field', e.target.value)} /></div>
                  <div><label className="form-label">Start</label><input className={inp} value={edu.startDate} onChange={e => updateEdu(edu.id, 'startDate', e.target.value)} /></div>
                  <div><label className="form-label">End</label><input className={inp} value={edu.endDate} onChange={e => updateEdu(edu.id, 'endDate', e.target.value)} /></div>
                </div>
              </div>
            ))}
            <button onClick={addEdu} className="btn-secondary w-full text-xs"><Plus size={14} /> Add School</button>
          </Section>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-navy-700 flex gap-2">
          <button onClick={newResume} className="btn-secondary flex-1 text-xs"><Plus size={14} /> New</button>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary flex-1 text-xs">
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Right: preview + version list */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="flex-1 overflow-auto bg-slate-300 p-6 flex justify-center" ref={previewRef}>
          <div style={{ width: 794 }}>
            <ResumePreview profile={profile} template={template} accentColor={accentColor} />
          </div>
        </div>

        {/* Version sidebar */}
        <div className="w-56 border-l border-navy-700 flex flex-col bg-navy-950">
          <div className="px-3 py-3 border-b border-navy-700">
            <p className="text-xs font-semibold text-slate-400">VERSIONS ({resumes.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {resumes.map(r => (
              <div key={r.id} onClick={() => loadResume(r)}
                className={`px-3 py-2.5 cursor-pointer border-b border-navy-800 hover:bg-navy-800 transition-colors ${ active?.id === r.id ? 'bg-navy-800 border-l-2 border-l-teal-500' : '' }`}>
                <p className="text-xs font-medium text-slate-200 truncate">{r.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatDate(r.updatedAt)}</p>
                <div className="flex gap-1 mt-1.5">
                  <button onClick={e => { e.stopPropagation(); cloneResume(r) }} className="text-slate-600 hover:text-teal-400 p-0.5"><Copy size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteResume(r.id) }} className="text-slate-600 hover:text-red-400 p-0.5"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
