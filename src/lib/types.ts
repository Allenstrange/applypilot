export interface Experience {
  id: string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface Profile {
  id?: string
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
  summary: string
  skills: string[]
  certifications: string[]
  experience: Experience[]
  education: Education[]
}

export interface Resume {
  id: string
  title: string
  template: 'classic' | 'modern' | 'compact'
  accentColor: string
  profile: Profile
  targetRole?: string
  createdAt: string
  updatedAt: string
}

export interface ParsedRequirements {
  skills: string[]
  keywords: string[]
  seniority: string
  domain: string
}

export type ApplicationStatus = 'applied' | 'screened' | 'interview' | 'offer' | 'rejected'

export interface Job {
  id: string
  company: string
  title: string
  location?: string
  url?: string
  description: string
  requirements?: ParsedRequirements
  atsScore?: number
  status: string
  dateAdded: string
}

export interface Application {
  id: string
  resumeId?: string
  jobId?: string
  company: string
  title: string
  location?: string
  status: ApplicationStatus
  dateApplied: string
  salaryRange?: string
  contactName?: string
  contactEmail?: string
  notes?: string
  followUpDate?: string
  atsScore?: number
  url?: string
  createdAt?: string
  updatedAt?: string
}

export interface OutreachTemplate {
  id: string
  name: string
  type: 'cold-email' | 'linkedin' | 'follow-up' | 'thank-you' | 'referral'
  subject?: string
  body: string
  tags: string[]
  createdAt: string
}

export interface OutreachMessage {
  id: string
  applicationId?: string
  templateId?: string
  recipientName: string
  recipientEmail?: string
  channel: 'email' | 'linkedin' | 'other'
  subject?: string
  body: string
  status: 'draft' | 'sent' | 'replied' | 'no-response'
  sentDate?: string
  createdAt: string
}

export interface CoverLetter {
  id: string
  applicationId?: string
  jobTitle?: string
  company?: string
  tone: 'formal' | 'conversational' | 'confident'
  body: string
  createdAt: string
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'grok' | 'custom'
  apiKey: string
  model: string
  endpoint?: string
}
