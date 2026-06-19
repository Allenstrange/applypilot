import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { callAI, isAIConfigured } from '@/lib/ai'
import type { Job, CoverLetter as CoverLetterType } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { generateId, formatDate } from '@/lib/utils'
import { Wand2, Copy, Save, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

type Tone = 'formal' | 'conversational' | 'confident'
type Step = 1 | 2 | 3
type ProfileSnippet = { name?: string; skills?: string[]; summary?: string; experience?: { company: string; title: string; bullets: string[] }[] } | null

function buildCoverLetter(profile: ProfileSnippet, jobTitle: string, company: string, tone: Tone): string {
  const name = profile?.name || 'the hiring team'
  const role = jobTitle || 'this role'
  const co = company || 'your company'
  const skills = (profile?.skills ?? []).slice(0, 4).join(', ') || 'my technical skills'
  const topExp = profile?.experience?.[0]
  const openings: Record<Tone, string> = {
    formal: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role} position at ${co}.`,
    conversational: `Hi there,\n\nI was excited to see the ${role} opening at ${co} \u2014 it's exactly the kind of role I've been looking for.`,
    confident: `I'm a strong candidate for the ${role} role at ${co}, and I'd like to tell you why.`,
  }
  const middles: Record<Tone, string> = {
    formal: `With a background encompassing ${skills}, I have consistently delivered results in fast-paced environments. ${topExp ? `Most recently at ${topExp.company} as ${topExp.title}, I ${topExp.bullets[0]?.toLowerCase() || 'led key initiatives that drove measurable impact'}.` : ''}`,
    conversational: `I've spent my career building expertise in ${skills}. ${topExp ? `At ${topExp.company}, I ${topExp.bullets[0]?.toLowerCase() || 'worked on exciting challenges'} \u2014 the kind of impact I'm eager to continue at ${co}.` : ''}`,
    confident: `My background in ${skills} is directly aligned with what you need. ${topExp ? `At ${topExp.company} as ${topExp.title}, I delivered: ${topExp.bullets[0] || 'exceptional results'}.` : ''}`,
  }
  const closings: Record<Tone, string> = {
    formal: `I would welcome the opportunity to discuss how my experience aligns with the needs of your team. Thank you for your consideration.\n\nSincerely,\n${name}`,
    conversational: `I'd love to chat more about how I could contribute. Thanks so much for considering my application!\n\nBest,\n${name}`,
    confident: `I'm ready to bring this energy to ${co} and would love to connect. Let's talk.\n\n\u2014 ${name}`,
  }
  return `${openings[tone]}\n\n${middles[tone]}\n\n${closings[tone]}`
}

export default function CoverLetter() {
  const { addToast } = useAppStore()
  const [step, setStep] = useState<Step>(1)
  const [jobs, setJobs] = useState<Job[]>([])
  const [letters, setLetters] = useState<CoverLetterType[]>([])
  const [selectedJobId, setSelectedJobId] = useState('new')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jdText, setJdText] = useState('')
  const [tone, setTone] = useState<Tone>('formal')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeResume, setActiveResume] = useState<ProfileSnippet>(null)

  useEffect(() => {
    setJobs(storage.getJobs())
    setLetters(storage.getCoverLetters())
    const resumes = storage.getResumes()
    if (resumes.length > 0) setActiveResume(resumes[0].profile)
  }, [])

  useEffect(() => {
    if (selectedJobId !== 'new') {
      const job = jobs.find(j => j.id === selectedJobId)
      if (job) { setJobTitle(job.title); setCompany(job.company); setJdText(job.description) }
    }
  }, [selectedJobId, jobs])

  async function generate() {
    setGenerating(true)
    try {
      if (isAIConfigured()) {
        const prompt = `Write a ${tone} cover letter for a ${jobTitle} position at ${company}.\n\nJob Description:\n${jdText}\n\nCandidate profile:\nName: ${activeResume?.name || 'Candidate'}\nSkills: ${(activeResume?.skills ?? []).join(', ')}\nSummary: ${(activeResume as { summary?: string })?.summary || ''}\nMost recent role: ${activeResume?.experience?.[0]?.title || ''} at ${activeResume?.experience?.[0]?.company || ''}\n\nWrite only the letter body, no explanations.`
        const result = await callAI(prompt)
        setBody(result)
        addToast('Cover letter generated with AI', 'success')
      } else {
        setBody(buildCoverLetter(activeResume, jobTitle, company, tone))
        addToast('Generated from template (configure AI in Settings for AI-powered writing)', 'info')
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Generation failed', 'error')
    }
    setGenerating(false)
  }

  function saveLetter() {
    if (!body) return
    const letter: CoverLetterType = { id: generateId(), jobTitle, company, tone, body, createdAt: new Date().toISOString() }
    storage.addCoverLetter(letter)
    setLetters(prev => [letter, ...prev])
    addToast('Cover letter saved', 'success')
  }

  function copyLetter() { navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Cover Letter Generator</h1>
        <p className="text-slate-500 text-sm mt-1">{isAIConfigured() ? 'AI-powered' : 'Template-based'} cover letters tailored to job descriptions</p>
      </div>
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <>
            <button key={s} onClick={() => step > s && setStep(s)}
              className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center transition-colors ${step === s ? 'bg-teal-600 text-white' : step > s ? 'bg-teal-600/30 text-teal-400 cursor-pointer hover:bg-teal-600/50' : 'bg-navy-700 text-slate-500'}`}>
              {s}
            </button>
            {i < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-teal-600/50' : 'bg-navy-700'}`} />}
          </>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="card space-y-4">
              <h2 className="section-title">Step 1: Job Details</h2>
              <div>
                <label className="form-label">Load from Saved Jobs</label>
                <select className="w-full" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
                  <option value="new">Enter new job details</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.company} \u2014 {j.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Company</label><input className="w-full" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" /></div>
                <div><label className="form-label">Job Title</label><input className="w-full" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Senior Engineer" /></div>
              </div>
              <div>
                <label className="form-label">Job Description (optional, improves output)</label>
                <textarea rows={6} className="w-full resize-none" value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the job description..." />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary">Continue <ChevronRight size={16} /></button>
            </div>
          )}
          {step === 2 && (
            <div className="card space-y-4">
              <h2 className="section-title">Step 2: Configure Tone</h2>
              <div>
                <label className="form-label">Writing Tone</label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['formal', 'conversational', 'confident'] as Tone[]).map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${tone === t ? 'border-teal-500 bg-teal-600/15 text-teal-400' : 'border-navy-600 bg-navy-800 text-slate-400 hover:border-navy-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {!activeResume && <p className="text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3">No resume found. Build one in the Resume Builder for a personalized letter.</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary"><ChevronLeft size={16} />Back</button>
                <button onClick={async () => { await generate(); setStep(3) }} disabled={generating} className="btn-primary flex-1">
                  {generating ? (
                    <span className="inline-flex items-center gap-1"><span className="animate-spin">⟳</span> Generating...</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><Wand2 size={16} />{isAIConfigured() ? 'Generate with AI' : 'Generate Letter'}</span>
                  )}
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Step 3: Review & Export</h2>
                <div className="flex gap-2">
                  <button onClick={generate} className="btn-ghost text-xs"><Sparkles size={13} />Regenerate</button>
                  <button onClick={copyLetter} className="btn-secondary text-xs">{copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}</button>
                  <button onClick={saveLetter} className="btn-primary text-xs"><Save size={13} />Save</button>
                </div>
              </div>
              <textarea rows={18} className="w-full resize-none font-mono text-sm" value={body} onChange={e => setBody(e.target.value)} />
              <button onClick={() => setStep(2)} className="btn-ghost text-xs"><ChevronLeft size={14} />Back to configure</button>
            </div>
          )}
        </div>
        <div className="card h-fit">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Saved Letters ({letters.length})</h3>
          {letters.length === 0 ? (
            <p className="text-xs text-slate-600">No saved letters yet. Generate and save one above.</p>
          ) : (
            <div className="space-y-2">
              {letters.map(l => (
                <div key={l.id} onClick={() => { setBody(l.body); setJobTitle(l.jobTitle ?? ''); setCompany(l.company ?? ''); setTone(l.tone); setStep(3) }}
                  className="p-3 bg-navy-900 rounded-lg border border-navy-700 cursor-pointer hover:border-navy-600 transition-colors">
                  <p className="text-sm text-slate-200 font-medium">{l.company || 'Unknown Company'}</p>
                  <p className="text-xs text-slate-500">{l.jobTitle}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="badge badge-teal capitalize">{l.tone}</span>
                    <span className="text-xs text-slate-600">{formatDate(l.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}