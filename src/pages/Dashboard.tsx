import { useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import type { Application } from '@/lib/types'
import { formatRelative, pct } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { Briefcase, TrendingUp, MessageSquare, Trophy, ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  applied: '#3b82f6', screened: '#a78bfa', interview: '#f59e0b', offer: '#10b981', rejected: '#ef4444',
}
const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied', screened: 'Screened', interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
}

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([])

  useEffect(() => {
    setApps(storage.getApplications())
  }, [])

  const total = apps.length
  const responded = apps.filter(a => ['screened', 'interview', 'offer'].includes(a.status)).length
  const interviewed = apps.filter(a => ['interview', 'offer'].includes(a.status)).length
  const offers = apps.filter(a => a.status === 'offer').length
  const active = apps.filter(a => !['offer', 'rejected'].includes(a.status)).length

  const statusCounts = ['applied', 'screened', 'interview', 'offer', 'rejected'].map(s => ({
    name: STATUS_LABELS[s], value: apps.filter(a => a.status === s).length, color: STATUS_COLORS[s],
  }))

  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (11 - i) * 7)
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay())
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    const count = apps.filter(a => { const ad = new Date(a.dateApplied); return ad >= weekStart && ad <= weekEnd }).length
    return { week: `W${12 - i}`, count }
  }).reverse().slice(0, 12).reverse()

  const recent = apps.slice(0, 8)

  const kpis = [
    { label: 'Total Applications', value: total, sub: `${active} active`, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Response Rate', value: pct(responded, total), sub: `${responded} responses`, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Interview Rate', value: pct(interviewed, total), sub: `${interviewed} interviews`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Offers Received', value: offers.toString(), sub: pct(offers, total) + ' offer rate', icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your job search at a glance</p>
      </div>
      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map(k => (
              <div key={k.label} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-medium">{k.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon size={16} className={k.color} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">{k.value}</div>
                <div className="text-xs text-slate-500 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Application Pipeline</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111f3d', border: '1px solid #1e2a5e', borderRadius: 8, color: '#e2e8f0' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusCounts.map((s, i) => <Cell key={i} fill={s.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusCounts.filter(s => s.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {statusCounts.filter(s => s.value > 0).map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111f3d', border: '1px solid #1e2a5e', borderRadius: 8, color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {statusCounts.filter(s => s.value > 0).map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-400">{s.name}</span>
                    </div>
                    <span className="text-slate-300 font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Applications per Week</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111f3d', border: '1px solid #1e2a5e', borderRadius: 8, color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300">Recent Applications</h3>
                <NavLink to="/tracker" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">View all <ArrowRight size={12} /></NavLink>
              </div>
              <div className="space-y-2">
                {recent.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-navy-700 last:border-0">
                    <div>
                      <p className="text-sm text-slate-200 font-medium leading-tight">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-slate text-xs">{STATUS_LABELS[a.status]}</span>
                      <p className="text-xs text-slate-600 mt-1">{formatRelative(a.dateApplied)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
        <Briefcase size={28} className="text-teal-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-200 mb-2">No applications yet</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-6">Start tracking your job applications to see analytics and insights here.</p>
      <NavLink to="/tracker" className="btn-primary">Add your first application</NavLink>
    </div>
  )
}
