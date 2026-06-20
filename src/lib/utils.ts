export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function pct(num: number, den: number): string {
  if (!den) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

/** Find all {{token}} placeholders in a string (deduped, in order of appearance). */
export function extractTokens(...texts: (string | undefined)[]): string[] {
  const seen = new Set<string>()
  const re = /\{\{\s*([\w.]+)\s*\}\}/g
  for (const text of texts) {
    if (!text) continue
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) seen.add(m[1])
  }
  return Array.from(seen)
}

/** Replace {{token}} placeholders with provided values; unfilled tokens stay literal. */
export function applyTokens(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => values[k]?.trim() ? values[k] : `{{${k}}}`)
}

/** "recruiter_name" -> "Recruiter Name" for use as a form label. */
export function humanizeToken(token: string): string {
  return token.replace(/[_.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
