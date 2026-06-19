import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { analyzeATS, resumeToText, type ATSResult } from '@/lib/ats'
import type { Job, Resume } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { generateId } from '@/lib/utils'
import { ScanLine, CheckCircle2, XCircle, AlertCircle, Minus } from 'lucide-react'

export default function AtsScanner() {
  const { addToast } = useAppStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('new')
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [jdText, setJdText] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [result, setResult] = useState<ATSResult | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('jobs').select('*').order('date_added', { ascending: false }),
      supabase.from('resumes').select('*').order('updated_at', { ascending: false }),
    ]).then(([{ data: jd }, { data: rd }]) => {
      setJobs((jd ?? []).map(j => ({
        id: j.id, company: j.company, title: j.title, location: j.location,
        url: j.url, description: j.description, requirements: j.requirements,
        atsScore: j.ats_score, status: j.status, dateAdded: j.date_added,
      })))
      setResumes((rd ?? []).map(r => ({
        id: r.id, title: r.title, template: r.template, accentColor: r.accent_color,
        profile: r.profile, createdAt: r.created_at, updatedAt: r.updated_at,
      })))
      if (rd && rd.length > 0) setSelectedResumeId(rd[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedJobId && selectedJobId !== 'new') {
      const job = jobs.find(j => j.id === selectedJobId)
      if (job) { setJdText(job.description); setCompany(job.company); setJobTitle(job.title) }
    } else {
      setJdText(''); setCompany(''); setJobTitle('')
    }
  }, [selectedJobId, jobs])

  async function runScan() {
    if (!jdText.trim()) { addToast('Paste a job description first', 'error'); return }
    setScanning(true)
    const resume = resumes.find(r => r.id === selectedResumeId)
    const resumeText = resume ? resumeToText(resume.profile) : ''
    const bullets = resume?.profile.experience.flatMap(e => e.bullets) ?? []
    const r = analyzeATS(jdText, resumeText, bullets)
    setResult(r)

    // Save job to Supabase
    const jobId = selectedJobId !== 'new' ? selectedJobId : generateId()
    await supabase.from('jobs').upsert({
      id: jobId, company, title: jobTitle, description: jdText, ats_score: r.score,
      status: 'saved', date_added: new Date().toISOString(),
    })
    if (selectedJobId === 'new') {
      const newJob: Job = { id: jobId, company, title: jobTitle, description: jdText, atsScore: r.score, status: 'saved', dateAdded: new Date().toISOString() }
      setJobs(prev => [newJob, ...prev])
      setSelectedJobId(jobId)
    } else {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, atsScore: r.score } : j))
    }
    setScanning(false)
    addToast(`ATS analysis complete — ${r.score}% match`, r.score >= 60 ? 'success' : 'info')
  }

  const scoreColor = result ? (result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444') : '#64748b'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">ATS Scanner</h1>
        <p className="text-slate-500 text-sm mt-1">Analyze how well your resume matches a job description</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Job Details</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Load Saved Job</label>
                <select className="w-full" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
                  <option value="new">Paste new job description</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.company} — {j.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Company</label><input className="w-full" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" /></div>
                <div><label className="form-label">Job Title</label><input className="w-full" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Senior Engineer" /></div>
              </div>
              <div>
                <label className="form-label">Job Description</label>
                <textarea rows={10} className="w-full resize-none" value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full job description here..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Resume to Compare</h3>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">No resumes saved. Build one in Resume Builder first.</p>
            ) : (
              <select className="w-full" value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            )}
          </div>

          <button onClick={runScan} disabled={scanning} className="btn-primary w-full">
            <ScanLine size={16} />{scanning ? 'Analyzing...' : 'Run ATS Analysis'}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {!result ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <ScanLine size={40} className="text-navy-600 mb-4" />
              <p className="text-slate-500 text-sm">Run a scan to see your ATS match score and keyword analysis.</p>
            </div>
          ) : (
            <>
              {/* Score */}
              <div className="card flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2a5e" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10"
                      strokeDasharray={`${(result.score / 100) * 251} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{result.score}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-100">
                    {result.score >= 70 ? 'Strong Match' : result.score >= 40 ? 'Partial Match' : 'Weak Match'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {result.matched.length} matched · {result.partial.length} partial · {result.missing.length} missing
                  </p>
                </div>
              </div>

              {/* Keywords */}
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Keyword Analysis</h3>
                {result.matched.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-green-400 font-medium mb-1.5">Matched ({result.matched.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched.map(k => <span key={k} className="badge badge-green">{k}</span>)}
                    </div>
                  </div>
                )}
                {result.partial.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-amber-400 font-medium mb-1.5">Partial ({result.partial.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.partial.map(k => <span key={k} className="badge badge-amber">{k}</span>)}
                    </div>
                  </div>
                )}
                {result.missing.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-medium mb-1.5">Missing ({result.missing.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing.map(k => <span key={k} className="badge badge-red">{k}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* ATS Checks */}
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">ATS Compatibility Checks</h3>
                <div className="space-y-2">
                  {result.checks.map(c => (
                    <div key={c.label} className="flex items-start gap-3">
                      {c.passed
                        ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                        : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-sm text-slate-200">{c.label}</p>
                        <p className="text-xs text-slate-500">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bullet issues */}
              {result.bulletIssues.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Bullet Strength Issues</h3>
                  <div className="space-y-3">
                    {result.bulletIssues.map((bi, i) => (
                      <div key={i} className="p-3 bg-navy-900 rounded-lg border border-amber-500/20">
                        <div className="flex items-start gap-2 mb-1">
                          <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 line-clamp-2">{bi.bullet}</p>
                        </div>
                        <p className="text-xs text-teal-400 ml-5">{bi.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
