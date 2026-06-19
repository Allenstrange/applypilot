import type { Resume, Application, Job, OutreachTemplate, OutreachMessage, CoverLetter } from './types'

const KEYS = {
  resumes: 'ap_resumes',
  applications: 'ap_applications',
  jobs: 'ap_jobs',
  templates: 'ap_templates',
  messages: 'ap_messages',
  coverLetters: 'ap_cover_letters',
}

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function write<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

function upsert<T extends { id: string }>(key: string, item: T): T {
  const all = read<T>(key)
  const idx = all.findIndex(x => x.id === item.id)
  if (idx >= 0) all[idx] = item
  else all.unshift(item)
  write(key, all)
  return item
}

export const storage = {
  getResumes: () => read<Resume>(KEYS.resumes),
  upsertResume: (r: Resume) => upsert(KEYS.resumes, r),
  deleteResume: (id: string) => write(KEYS.resumes, read<Resume>(KEYS.resumes).filter(r => r.id !== id)),

  getApplications: () => read<Application>(KEYS.applications),
  saveApplications: (items: Application[]) => write(KEYS.applications, items),
  upsertApplication: (a: Application) => upsert(KEYS.applications, a),
  deleteApplication: (id: string) => write(KEYS.applications, read<Application>(KEYS.applications).filter(a => a.id !== id)),

  getJobs: () => read<Job>(KEYS.jobs),
  upsertJob: (j: Job) => upsert(KEYS.jobs, j),

  getTemplates: () => read<OutreachTemplate>(KEYS.templates),
  upsertTemplate: (t: OutreachTemplate) => upsert(KEYS.templates, t),
  deleteTemplate: (id: string) => write(KEYS.templates, read<OutreachTemplate>(KEYS.templates).filter(t => t.id !== id)),

  getMessages: () => read<OutreachMessage>(KEYS.messages),
  upsertMessage: (m: OutreachMessage) => upsert(KEYS.messages, m),
  updateMessageStatus: (id: string, status: OutreachMessage['status']) => {
    const all = read<OutreachMessage>(KEYS.messages)
    const updated = all.map(m => m.id === id ? { ...m, status } : m)
    write(KEYS.messages, updated)
  },

  getCoverLetters: () => read<CoverLetter>(KEYS.coverLetters),
  addCoverLetter: (l: CoverLetter) => {
    const all = read<CoverLetter>(KEYS.coverLetters)
    all.unshift(l)
    write(KEYS.coverLetters, all)
    return l
  },
}
