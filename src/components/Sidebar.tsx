import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, ScanLine, KanbanSquare,
  Mail, PenLine, Settings, X, Wifi, WifiOff,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume-builder', icon: FileText,         label: 'Resume Builder' },
  { to: '/ats-scanner',    icon: ScanLine,         label: 'ATS Scanner' },
  { to: '/tracker',        icon: KanbanSquare,     label: 'Job Tracker' },
  { to: '/outreach',       icon: Mail,             label: 'Outreach Hub' },
  { to: '/cover-letter',   icon: PenLine,          label: 'Cover Letter' },
]

interface Props { onClose?: () => void }

export default function Sidebar({ onClose }: Props) {
  const { aiConfigured } = useAppStore()
  const navigate = useNavigate()

  return (
    <aside className="h-full flex flex-col bg-navy-950 border-r border-navy-700">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-navy-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M3 17 L7 7 L12 14 L17 7 L21 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-slate-100 text-[15px]">ApplyPilot</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-navy-700 text-slate-500 lg:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
            )}
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 flex-shrink-0 border-t border-navy-700 pt-3">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
          {aiConfigured
            ? <><Wifi size={13} className="text-teal-400" /><span className="text-teal-400">AI connected</span></>
            : <><WifiOff size={13} className="text-slate-600" /><span>AI not configured</span></>}
        </div>
        <button
          onClick={() => { navigate('/settings'); onClose?.() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
        >
          <Settings size={17} />
          Settings
        </button>
      </div>
    </aside>
  )
}
