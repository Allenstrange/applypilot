import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import type { Application, ApplicationStatus } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { generateId, formatDate } from '@/lib/utils'
import { Plus, X, ExternalLink, Bell, Edit2, Trash2 } from 'lucide-react'

const COLUMNS: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: 'applied',   label: 'Applied',   color: 'text-blue-400' },
  { key: 'screened',  label: 'Screened',  color: 'text-purple-400' },
  { key: 'interview', label: 'Interview', color: 'text-amber-400' },
  { key: 'offer',     label: 'Offer',     color: 'text-green-400' },
  { key: 'rejected',  label: 'Rejected',  color: 'text-red-400' },
]

const BLANK = {
  company: '', title: '', location: '', status: 'applied' as ApplicationStatus,
  dateApplied: new Date().toISOString().split('T')[0],
  salaryRange: '', contactName: '', contactEmail: '', notes: '', followUpDate: '', url: '',
}

export default function Tracker() {
  const { addToast } = useAppStore()
  const [apps, setApps] = useState<Application[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)
  const [form, setForm] = useState({ ...BLANK })
  const [detail, setDetail] = useState<Application | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null)

  function dropOn(status: ApplicationStatus) {
    setDragOverCol(null)
    if (dragId) {
      const app = apps.find(a => a.id === dragId)
      if (app && app.status !== status) { updateStatus(dragId, status); addToast(`Moved to ${status}`, 'success') }
    }
    setDragId(null)
  }

  useEffect(() => {
    setApps(storage.getApplications())
  }, [])

  function openAdd() { setEditing(null); setForm({ ...BLANK }); setShowModal(true) }
  function openEdit(a: Application) {
    setEditing(a)
    setForm({
      company: a.company, title: a.title, location: a.location ?? '',
      status: a.status, dateApplied: a.dateApplied?.split('T')[0] ?? '',
      salaryRange: a.salaryRange ?? '', contactName: a.contactName ?? '',
      contactEmail: a.contactEmail ?? '', notes: a.notes ?? '',
      followUpDate: a.followUpDate?.split('T')[0] ?? '', url: a.url ?? '',
    })
    setShowModal(true)
  }

  function save() {
    if (!form.company || !form.title) { addToast('Company and title required', 'error'); return }
    if (editing) {
      const updated: Application = {
        ...editing,
        company: form.company, title: form.title, location: form.location, status: form.status,
        dateApplied: form.dateApplied || new Date().toISOString(),
        salaryRange: form.salaryRange, contactName: form.contactName,
        contactEmail: form.contactEmail, notes: form.notes,
        followUpDate: form.followUpDate || undefined, url: form.url,
        updatedAt: new Date().toISOString(),
      }
      storage.upsertApplication(updated)
      setApps(prev => prev.map(a => a.id === editing.id ? updated : a))
      addToast('Application updated', 'success')
    } else {
      const newApp: Application = {
        id: generateId(),
        company: form.company, title: form.title, location: form.location, status: form.status,
        dateApplied: form.dateApplied || new Date().toISOString(),
        salaryRange: form.salaryRange, contactName: form.contactName,
        contactEmail: form.contactEmail, notes: form.notes,
        followUpDate: form.followUpDate || undefined, url: form.url,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      storage.upsertApplication(newApp)
      setApps(prev => [newApp, ...prev])
      addToast('Application added', 'success')
    }
    setShowModal(false)
  }

  function deleteApp(id: string) {
    storage.deleteApplication(id)
    setApps(prev => prev.filter(a => a.id !== id))
    setDetail(null)
    addToast('Deleted', 'info')
  }

  function updateStatus(id: string, status: ApplicationStatus) {
    const app = apps.find(a => a.id === id)
    if (!app) return
    const updated = { ...app, status, updatedAt: new Date().toISOString() }
    storage.upsertApplication(updated)
    setApps(prev => prev.map(a => a.id === id ? updated : a))
    if (detail?.id === id) setDetail(updated)
  }

  const filtered = apps.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.company.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)) &&
           (filterStatus === 'all' || a.status === filterStatus)
  })

  const isOverdue = (a: Application) => a.followUpDate && new Date(a.followUpDate) < new Date() && !['offer', 'rejected'].includes(a.status)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-navy-700 flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Job Tracker</h1>
          <p className="text-slate-500 text-xs mt-0.5">{apps.length} applications total</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-44" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ApplicationStatus | 'all')} className="w-36">
            <option value="all">All statuses</option>
            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} />Add</button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colApps = filtered.filter(a => a.status === col.key)
            return (
              <div key={col.key} className="w-64 flex flex-col flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  <span className="badge badge-slate">{colApps.length}</span>
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); if (dragOverCol !== col.key) setDragOverCol(col.key) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null) }}
                  onDrop={e => { e.preventDefault(); dropOn(col.key) }}
                  className={`flex-1 space-y-2 overflow-y-auto rounded-xl p-1 transition-colors ${dragOverCol === col.key ? 'bg-teal-500/5 ring-1 ring-teal-500/40' : ''}`}
                >
                  {colApps.map(a => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={e => { setDragId(a.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null) }}
                      onClick={() => setDetail(a)}
                      className={`card cursor-pointer hover:border-navy-600 transition-all relative active:cursor-grabbing ${dragId === a.id ? 'opacity-40' : ''}`}
                    >
                      {isOverdue(a) && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400" title="Follow-up overdue" />}
                      <p className="text-sm font-semibold text-slate-200 leading-tight">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.company}</p>
                      {a.atsScore != null && <span className="badge badge-teal mt-2">{a.atsScore}% ATS</span>}
                      <p className="text-xs text-slate-600 mt-2">{formatDate(a.dateApplied)}</p>
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <div className={`text-center py-8 text-xs border border-dashed rounded-lg transition-colors ${dragOverCol === col.key ? 'border-teal-500/40 text-teal-400' : 'border-transparent text-slate-700'}`}>
                      {dragOverCol === col.key ? 'Drop here' : 'No applications'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-navy-700">
              <h2 className="font-semibold text-slate-100">{editing ? 'Edit Application' : 'Add Application'}</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Company *</label><input className="w-full" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
                <div><label className="form-label">Job Title *</label><input className="w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="form-label">Location</label><input className="w-full" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div><label className="form-label">Status</label>
                  <select className="w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ApplicationStatus }))}>
                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Date Applied</label><input type="date" className="w-full" value={form.dateApplied} onChange={e => setForm(f => ({ ...f, dateApplied: e.target.value }))} /></div>
                <div><label className="form-label">Salary Range</label><input className="w-full" value={form.salaryRange} onChange={e => setForm(f => ({ ...f, salaryRange: e.target.value }))} placeholder="$100k-$130k" /></div>
                <div><label className="form-label">Contact Name</label><input className="w-full" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
                <div><label className="form-label">Contact Email</label><input className="w-full" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                <div><label className="form-label">Follow-up Date</label><input type="date" className="w-full" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
                <div><label className="form-label">Job URL</label><input className="w-full" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Notes</label><textarea rows={3} className="w-full resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-navy-700">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 bg-navy-800 border-l border-navy-700 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-navy-700">
            <h2 className="font-semibold text-slate-100 truncate">{detail.title}</h2>
            <button onClick={() => setDetail(null)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <p className="text-lg font-bold text-slate-100">{detail.company}</p>
              {detail.location && <p className="text-sm text-slate-500">{detail.location}</p>}
              {detail.salaryRange && <p className="text-sm text-teal-400 mt-1">{detail.salaryRange}</p>}
            </div>
            <div>
              <label className="form-label">Move to Stage</label>
              <select className="w-full" value={detail.status} onChange={e => updateStatus(detail.id, e.target.value as ApplicationStatus)}>
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            {detail.contactName && <div><p className="form-label">Contact</p><p className="text-sm text-slate-300">{detail.contactName}</p>{detail.contactEmail && <p className="text-xs text-slate-500">{detail.contactEmail}</p>}</div>}
            {detail.followUpDate && (
              <div className="flex items-center gap-2">
                <Bell size={14} className={isOverdue(detail) ? 'text-red-400' : 'text-amber-400'} />
                <p className={`text-sm ${isOverdue(detail) ? 'text-red-400' : 'text-amber-400'}`}>
                  Follow up {formatDate(detail.followUpDate)}{isOverdue(detail) ? ' (overdue)' : ''}
                </p>
              </div>
            )}
            {detail.notes && <div><p className="form-label">Notes</p><p className="text-sm text-slate-400 whitespace-pre-wrap">{detail.notes}</p></div>}
          </div>
          <div className="p-4 border-t border-navy-700 flex gap-2">
            {detail.url && <a href={detail.url} target="_blank" rel="noreferrer" className="btn-secondary flex-1 justify-center"><ExternalLink size={14} />Job URL</a>}
            <button onClick={() => { openEdit(detail); setDetail(null) }} className="btn-secondary"><Edit2 size={14} /></button>
            <button onClick={() => deleteApp(detail.id)} className="btn-danger"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
