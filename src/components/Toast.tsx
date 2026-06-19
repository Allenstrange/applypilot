import { useAppStore } from '@/lib/store'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import type { Toast } from '@/lib/store'

const ICONS = {
  success: <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />,
  error:   <AlertCircle size={16} className="text-red-400 flex-shrink-0" />,
  info:    <Info size={16} className="text-teal-400 flex-shrink-0" />,
}

const BORDERS = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  info:    'border-teal-500/30',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useAppStore(s => s.removeToast)
  return (
    <div className={`flex items-start gap-3 bg-navy-800 border ${BORDERS[toast.type]} rounded-xl p-3.5 shadow-xl min-w-64 max-w-sm animate-in fade-in slide-in-from-right-4 duration-200`}>
      {ICONS[toast.type]}
      <p className="flex-1 text-sm text-slate-200 leading-snug">{toast.message}</p>
      <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-slate-300 mt-0.5">
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastLayer() {
  const toasts = useAppStore(s => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
