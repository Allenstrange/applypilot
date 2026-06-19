export interface ATSResult {
  score: number
  matched: string[]
  missing: string[]
  partial: string[]
  checks: ATSCheck[]
  bulletIssues: BulletIssue[]
}

export interface ATSCheck {
  label: string
  passed: boolean
  message: string
}

export interface BulletIssue {
  bullet: string
  issue: string
  suggestion: string
}

const WEAK_VERBS = [
  'responsible for', 'worked on', 'helped with', 'assisted', 'was part of',
  'involved in', 'participated in', 'contributed to',
]
const STRONG_VERB_LIST = [
  'Led', 'Drove', 'Built', 'Delivered', 'Achieved', 'Increased', 'Reduced',
  'Launched', 'Designed', 'Implemented', 'Managed', 'Spearheaded', 'Engineered',
  'Developed', 'Streamlined', 'Optimized', 'Scaled', 'Automated',
]

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
}

function extractKeywords(jd: string): string[] {
  const text = jd.toLowerCase()
  const tech = /\b(react|vue|angular|node\.?js|python|java|typescript|javascript|aws|azure|gcp|docker|kubernetes|sql|postgresql|mongodb|redis|graphql|rest api|agile|scrum|ci\/cd|git|linux|machine learning|data science|figma|product management|project management|salesforce|excel|tableau|power bi|next\.?js|django|flask|spring|terraform|ansible)\b/g
  const found = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = tech.exec(text)) !== null) found.add(m[1])

  const words = Array.from(tokenize(jd))
  const freq: Record<string, number> = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  Object.entries(freq)
    .filter(([w, c]) => c >= 2 && w.length > 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([w]) => found.add(w))

  return Array.from(found).filter(k => k.length > 3).slice(0, 30)
}

export function analyzeATS(jdText: string, resumeText: string, bullets: string[] = []): ATSResult {
  const keywords = extractKeywords(jdText)
  const resumeTokens = tokenize(resumeText)

  const matched: string[] = []
  const missing: string[] = []
  const partial: string[] = []

  keywords.forEach(kw => {
    const kwTokens = Array.from(tokenize(kw))
    const allMatch = kwTokens.every(t => resumeTokens.has(t))
    const someMatch = kwTokens.some(t => resumeTokens.has(t))
    if (allMatch) matched.push(kw)
    else if (someMatch) partial.push(kw)
    else missing.push(kw)
  })

  const total = keywords.length || 1
  const score = Math.min(100, Math.round(((matched.length + partial.length * 0.5) / total) * 100))

  const hasContact = /[\w.+-]+@[\w-]+\.\w+/.test(resumeText) || /\d{3}[-.]\d{3}/.test(resumeText)
  const hasQuantified = /\b\d+[%$x]|\d+\s*(percent|million|thousand|users|customers|revenue|growth)/i.test(resumeText)
  const hasStandardSections = /experience|education|skills/i.test(resumeText)
  const hasGoodLength = resumeText.length > 400
  const noSpecialChars = !/[★●►▶▸]/u.test(resumeText)

  const checks: ATSCheck[] = [
    { label: 'Contact information', passed: hasContact, message: hasContact ? 'Email/phone detected' : 'Missing email or phone number' },
    { label: 'Quantified achievements', passed: hasQuantified, message: hasQuantified ? 'Numbers found in content' : 'Add metrics (%, $, numbers) to bullets' },
    { label: 'Standard section headings', passed: hasStandardSections, message: hasStandardSections ? 'Experience, Education, Skills found' : 'Add standard section headings' },
    { label: 'Clean text formatting', passed: noSpecialChars, message: noSpecialChars ? 'No problematic symbols' : 'Remove special bullet symbols' },
    { label: 'Adequate content length', passed: hasGoodLength, message: hasGoodLength ? 'Good content length' : 'Resume may be too brief' },
    { label: 'Keyword match threshold', passed: score >= 40, message: score >= 40 ? `${score}% match — good` : `Only ${score}% match — add more keywords` },
  ]

  const bulletIssues: BulletIssue[] = bullets
    .filter(b => WEAK_VERBS.some(v => b.toLowerCase().includes(v)))
    .slice(0, 5)
    .map(b => ({
      bullet: b,
      issue: 'Weak action verb detected',
      suggestion: `Rewrite starting with: ${STRONG_VERB_LIST[Math.floor(Math.random() * STRONG_VERB_LIST.length)]}`,
    }))

  return { score, matched, missing, partial, checks, bulletIssues }
}

export function resumeToText(profile: { name: string; email: string; phone: string; summary: string; skills: string[]; experience: { company: string; title: string; bullets: string[] }[]; education: { school: string; degree: string; field: string }[] }): string {
  const parts: string[] = [
    profile.name, profile.email, profile.phone, profile.summary,
    ...profile.skills,
    ...profile.experience.flatMap(e => [e.company, e.title, ...e.bullets]),
    ...profile.education.flatMap(e => [e.school, e.degree, e.field]),
  ]
  return parts.join(' ')
}
