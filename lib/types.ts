// ============== DOMAIN TYPES ==============

export interface Experience {
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string;
  tools: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string;
  certs: string;
  experience: Experience[];
  education: Education[];
}

export type ProviderId = "openai" | "anthropic" | "gemini" | "grok" | "custom";

export interface ProviderConfig {
  apiKey: string;
  model: string;
  endpoint?: string;
}

export type ProviderSettings = {
  activeProvider: ProviderId;
} & Record<ProviderId, ProviderConfig>;

export type ApplicationStatus =
  | "planned"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

// ---------- Job analysis ----------

export interface MatchedConcept {
  concept: string;
  profileEvidence?: string;
}

export interface GapConcept {
  concept: string;
  importance?: string;
  suggestion?: string;
}

export interface ATSWarning {
  type: "error" | "warning" | "success";
  msg: string;
}

export interface Analysis {
  company: string;
  title: string;
  location: string;
  url: string;
  jd: string;
  jdKeywords: string[];
  matched: MatchedConcept[];
  missing: string[];
  gaps: GapConcept[];
  overallFit: number;
  senioritySignal: string;
  domainTags: string[];
  atsWarnings: ATSWarning[];
  isSemantic: boolean;
}

// ---------- Generation payloads ----------

export interface CoverLetter {
  subjectLine: string;
  salutation: string;
  body: string[];
  closing: string;
  signOff: string;
  keywords: string[];
}

export interface ResumeSummary {
  targetHeadline: string;
  introSummary: string;
  bulletPoints: string[];
  keywords: string[];
}

export interface InterviewPrep {
  questions: string[];
  answerFormulas: string[];
  coachTips: string[];
  keywords: string[];
}

export interface Outreach {
  subject: string;
  message: string;
  keywords: string[];
}

export interface Generations {
  coverLetter?: CoverLetter;
  resumeSummary?: ResumeSummary;
  interviewPrep?: InterviewPrep;
  outreach?: Outreach;
}

export type GenerationMode =
  | "coverLetter"
  | "resumeSummary"
  | "interviewPrep"
  | "outreach";

export interface Application {
  id: number;
  company: string;
  title: string;
  location?: string;
  url?: string;
  status: ApplicationStatus;
  createdAt: string;
  notes?: string;
  /** Snapshot so past generations can be reloaded without new API calls. */
  snapshot?: {
    analysis: Analysis;
    draftCV: Profile;
    generations: Generations;
  };
}

// ---------- Resume library ----------

export type TemplateId = "classic" | "modern" | "compact";

export interface ResumeDoc {
  id: string;
  name: string;
  templateId: TemplateId;
  profile: Profile;
  createdAt: string;
  updatedAt: string;
}

// ---------- Resume score ----------

export interface ScoreIssue {
  severity: "error" | "warning" | "tip";
  message: string;
  where?: string;
}

export interface ScoreCategory {
  label: string;
  score: number;
  max: number;
}

export interface ResumeScore {
  overall: number;
  categories: ScoreCategory[];
  issues: ScoreIssue[];
}
