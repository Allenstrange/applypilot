import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import type { OutreachTemplate, OutreachMessage } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { generateId, formatDate } from '@/lib/utils'
import { Plus, X, Mail, Linkedin, Send, CheckCircle, Clock, Copy, Trash2, Edit2 } from 'lucide-react'

const STARTER_TEMPLATES: Omit<OutreachTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Cold Outreach Email', type: 'cold-email',
    subject: 'Exploring opportunities at {{company_name}}',
    body: 'Hi {{recruiter_name}},\n\nI came across {{company_name}} and was immediately drawn to the work you\'re doing in {{industry}}. With my background in {{your_skills}}, I believe I could contribute meaningfully to your team.\n\nI\'d love to learn more about any open opportunities. Would you be open to a 20-minute call?\n\nBest,\n{{your_name}}',
    tags: ['cold', 'email'],
  },
  {
    name: 'LinkedIn Connection Request', type: 'linkedin',
    body: 'Hi {{recruiter_name}}, I\'m a {{your_role}} with experience in {{your_skills}}. I noticed you work at {{company_name}} and would love to connect. I\'m actively exploring new opportunities and would value your insights.',
    tags: ['linkedin', 'connection'],
  },
  {
    name: 'Follow-Up After Application', type: 'follow-up',
    subject: 'Following up on my application for {{role_title}}',
    body: 'Hi {{recruiter_name}},\n\nI wanted to follow up on my application for the {{role_title}} role at {{company_name}} submitted on {{date_applied}}. I\'m very excited about this opportunity and would love to discuss how my background aligns with your needs.\n\nThank you for your time.\n\nBest,\n{{your_name}}',
    tags: ['follow-up'],
  },
  {
    name: 'Post-Interview Thank You', type: 'thank-you',
    subject: 'Thank you \u2014 {{role_title}} interview',
    body: 'Hi {{interviewer_name}},\n\nThank you for taking the time to speak with me about the {{role_title}} role at {{company_name}}. I really enjoyed our conversation about {{topic_discussed}} and am even more excited about the opportunity.\n\nI look forward to hearing about next steps.\n\nBest,\n{{your_name}}',
    tags: ['thank-you', 'post-interview'],
  },
  {
    name: 'Referral Request', type: 'referral',
    subject: 'Quick favour \u2014 referral for {{company_name}}',
    body: 'Hi {{contact_name}},\n\nI hope you\'re doing well! I\'ve been following {{company_name}}\'s work and am very interested in the {{role_title}} position. Since you work there, I was wondering if you\'d be comfortable referring me or sharing any insights about the team.\n\nI\'d really appreciate your help.\n\nThanks,\n{{your_name}}',
    tags: ['referral'],
  },
]

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'cold-email': <Mail size={14} />, 'linkedin': <Linkedin size={14} />,
  'follow-up': <Clock size={14} />, 'thank-you': <CheckCircle size={14} />, 'referral': <Send size={14} />,
}
const TYPE_COLORS: Record<string, string> = {
  'cold-email': 'badge-blue', 'linkedin': 'badge-teal',
  'follow-up': 'badge-amber', 'thank-you': 'badge-green', 'referral': 'badge-purple',
}

export default function OutreachHub() {
  const { addToast } = useAppStore()
  const [tab, setTab] = useState<'templates' | 'log'>('templates')
  const [templates, setTemplates] = useState<OutreachTemplate[]>([])
  const [messages, setMessages] = useState<OutreachMessage[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'cold-email' as OutreachTemplate['type'], subject: '', body: '', tags: '' })
  const [composeForm, setComposeForm] = useState({ recipientName: '', recipientEmail: '', channel: 'email' as OutreachMessage['channel'], subject: '', body: '' })
  const [previewBody, setPreviewBody] = useState('')

  useEffect(() => {
    const saved = storage.getTemplates()
    if (saved.length === 0) {
      const seeded = STARTER_TEMPLATES.map(t => ({ ...t, id: generateId(), createdAt: new Date().toISOString() }))
      seeded.forEach(t => storage.upsertTemplate(t))
      setTemplates(seeded)
    } else {
      setTemplates(saved)
    }
    setMessages(storage.getMessages())
  }, [])

  function openNewTemplate() { setEditingTemplate(null); setTemplateForm({ name: '', type: 'cold-email', subject: '', body: '', tags: '' }); setShowTemplateModal(true) }
  function openEditTemplate(t: OutreachTemplate) { setEditingTemplate(t); setTemplateForm({ name: t.name, type: t.type, subject: t.subject ?? '', body: t.body, tags: t.tags.join(', ') }); setShowTemplateModal(true) }

  function saveTemplate() {
    if (!templateForm.name || !templateForm.body) { addToast('Name and body required', 'error'); return }
    const t: OutreachTemplate = {
      id: editingTemplate?.id ?? generateId(),
      name: templateForm.name, type: templateForm.type, subject: templateForm.subject,
      body: templateForm.body, tags: templateForm.tags.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: editingTemplate?.createdAt ?? new Date().toISOString(),
    }
    storage.upsertTemplate(t)
    if (editingTemplate) { setTemplates(prev => prev.map(x => x.id === t.id ? t : x)) }
    else { setTemplates(prev => [t, ...prev]) }
    setShowTemplateModal(false)
    addToast('Template saved', 'success')
  }

  function deleteTemplate(id: string) { storage.deleteTemplate(id); setTemplates(prev => prev.filter(t => t.id !== id)) }

  function openCompose(t: OutreachTemplate) {
    setSelectedTemplate(t)
    setComposeForm({ recipientName: '', recipientEmail: '', channel: t.type === 'linkedin' ? 'linkedin' : 'email', subject: t.subject ?? '', body: t.body })
    setPreviewBody(t.body)
    setShowComposeModal(true)
  }

  function updateTokens(form: typeof composeForm) {
    let preview = selectedTemplate?.body ?? form.body
    const replacements: Record<string, string> = { '{{recruiter_name}}': form.recipientName || '[Name]', '{{your_name}}': 'You' }
    Object.entries(replacements).forEach(([k, v]) => { preview = preview.replaceAll(k, v) })
    setPreviewBody(preview)
    setComposeForm(form)
  }

  function sendMessage() {
    if (!composeForm.recipientName) { addToast('Recipient name required', 'error'); return }
    const m: OutreachMessage = {
      id: generateId(), recipientName: composeForm.recipientName, recipientEmail: composeForm.recipientEmail,
      channel: composeForm.channel, subject: composeForm.subject, body: previewBody,
      templateId: selectedTemplate?.id, status: 'sent', sentDate: new Date().toISOString(), createdAt: new Date().toISOString(),
    }
    storage.upsertMessage(m)
    setMessages(prev => [m, ...prev])
    setShowComposeModal(false)
    addToast('Message logged as sent', 'success')
  }

  function updateMessageStatus(id: string, status: OutreachMessage['status']) {
    storage.updateMessageStatus(id, status)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  const replied = messages.filter(m => m.status === 'replied').length
  const sent = messages.filter(m => m.status !== 'draft').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Outreach Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Manage templates and track recruiter outreach</p>
        </div>
        <button onClick={tab === 'templates' ? openNewTemplate : () => { if (templates.length > 0) openCompose(templates[0]) }} className="btn-primary">
          <Plus size={16} />{tab === 'templates' ? 'New Template' : 'Compose'}
        </button>
      </div>
      <div className="flex gap-1 mb-5 bg-navy-800 rounded-xl p-1 w-fit">
        {(['templates', 'log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'log' ? `Sent Log (${messages.length})` : `Templates (${templates.length})`}
          </button>
        ))}
      </div>

      {tab === 'templates' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="card hover:border-navy-600 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${TYPE_COLORS[t.type]} flex items-center gap-1`}>{TYPE_ICONS[t.type]}{t.type.replace('-', ' ')}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEditTemplate(t)} className="text-slate-600 hover:text-teal-400 p-1"><Edit2 size={13} /></button>
                  <button onClick={() => {
                    const c: OutreachTemplate = { ...t, id: generateId(), name: `${t.name} (copy)`, createdAt: new Date().toISOString() }
                    storage.upsertTemplate(c)
                    setTemplates(prev => [c, ...prev])
                  }} className="text-slate-600 hover:text-slate-400 p-1"><Copy size={13} /></button>
                  <button onClick={() => deleteTemplate(t.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">{t.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-3 mb-3">{t.body}</p>
              <button onClick={() => openCompose(t)} className="btn-primary w-full text-xs"><Send size={13} />Use Template</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {sent > 0 && (
            <div className="card mb-4 flex items-center gap-6">
              <div className="text-center"><p className="text-2xl font-bold text-slate-100">{sent}</p><p className="text-xs text-slate-500">Sent</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-green-400">{replied}</p><p className="text-xs text-slate-500">Replied</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-teal-400">{sent > 0 ? Math.round((replied / sent) * 100) : 0}%</p><p className="text-xs text-slate-500">Reply Rate</p></div>
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-700">
                {['Recipient', 'Channel', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>)}
              </tr></thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-xs">No messages sent yet</td></tr>
                ) : messages.map(m => (
                  <tr key={m.id} className="border-b border-navy-800 hover:bg-navy-700/30">
                    <td className="px-4 py-3"><p className="text-slate-200 font-medium">{m.recipientName}</p>{m.recipientEmail && <p className="text-xs text-slate-500">{m.recipientEmail}</p>}</td>
                    <td className="px-4 py-3"><span className="badge badge-slate capitalize">{m.channel}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.sentDate ? formatDate(m.sentDate) : '\u2014'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${m.status === 'replied' ? 'badge-green' : m.status === 'sent' ? 'badge-blue' : m.status === 'no-response' ? 'badge-red' : 'badge-slate'}`}>
                        {m.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => updateMessageStatus(m.id, 'replied')} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-green-500/10">Replied</button>
                        <button onClick={() => updateMessageStatus(m.id, 'no-response')} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">No Reply</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-navy-700">
              <h2 className="font-semibold text-slate-100">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowTemplateModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="form-label">Template Name</label><input className="w-full" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="form-label">Type</label>
                  <select className="w-full" value={templateForm.type} onChange={e => setTemplateForm(f => ({ ...f, type: e.target.value as OutreachTemplate['type'] }))}>
                    <option value="cold-email">Cold Email</option><option value="linkedin">LinkedIn</option>
                    <option value="follow-up">Follow-Up</option><option value="thank-you">Thank You</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div><label className="form-label">Subject Line</label><input className="w-full" value={templateForm.subject} onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Body</label><textarea rows={8} className="w-full resize-none font-mono text-xs" value={templateForm.body} onChange={e => setTemplateForm(f => ({ ...f, body: e.target.value }))} /></div>
              <div><label className="form-label">Tags (comma-separated)</label><input className="w-full" value={templateForm.tags} onChange={e => setTemplateForm(f => ({ ...f, tags: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-navy-700">
              <button onClick={() => setShowTemplateModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveTemplate} className="btn-primary flex-1">Save Template</button>
            </div>
          </div>
        </div>
      )}

      {showComposeModal && selectedTemplate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-navy-700">
              <h2 className="font-semibold text-slate-100">Compose \u2014 {selectedTemplate.name}</h2>
              <button onClick={() => setShowComposeModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400">FILL IN DETAILS</h3>
                <div><label className="form-label">Recipient Name</label><input className="w-full" value={composeForm.recipientName} onChange={e => updateTokens({ ...composeForm, recipientName: e.target.value })} /></div>
                <div><label className="form-label">Recipient Email</label><input className="w-full" value={composeForm.recipientEmail} onChange={e => setComposeForm(f => ({ ...f, recipientEmail: e.target.value }))} /></div>
                <div><label className="form-label">Channel</label>
                  <select className="w-full" value={composeForm.channel} onChange={e => setComposeForm(f => ({ ...f, channel: e.target.value as OutreachMessage['channel'] }))}>
                    <option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="other">Other</option>
                  </select>
                </div>
                {composeForm.channel === 'email' && <div><label className="form-label">Subject</label><input className="w-full" value={composeForm.subject} onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))} /></div>}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2">PREVIEW</h3>
                <div className="bg-navy-900 border border-navy-700 rounded-lg p-3 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed h-56 overflow-y-auto">{previewBody}</div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-navy-700">
              <button onClick={() => setShowComposeModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendMessage} className="btn-primary flex-1"><Send size={14} />Log as Sent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}