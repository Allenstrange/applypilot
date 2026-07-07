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

export type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "grok"
  | "groq"
  | "openrouter"
  | "opencode"
  | "custom";

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
  /** Which resume version was used for this application (for resume performance analytics). */
  resumeId?: string;
  resumeName?: string;
  /** Status change history for the per-application timeline. */
  statusHistory?: { status: ApplicationStatus; at: string }[];
  /** Keyword match-rate snapshots, appended on each save — the tailoring trend. */
  scoreHistory?: { at: string; score: number }[];
  /** Snapshot so past generations can be reloaded without new API calls. */
  snapshot?: {
    analysis: Analysis;
    draftCV: Profile;
    generations: Generations;
  };
}

// ---------- Resume library ----------

export type TemplateId =
  | "classic-clear"
  | "atlantic-blue"
  | "mercury-flow"
  | "ledger"
  | "headline"
  | "slate";

export type SectionKey = "summary" | "skills" | "experience" | "education" | "certs";

export interface ResumeDoc {
  id: string;
  name: string;
  templateId: TemplateId;
  /** Optional per-resume accent colour override (customization). */
  accent?: string;
  /** Optional per-resume body font override (customization). */
  font?: "serif" | "sans" | "mono";
  /** Spacing / line-height preset (customization). */
  density?: "compact" | "normal" | "relaxed";
  /** Section-heading style toggles (customization). */
  headingUppercase?: boolean;
  headingUnderline?: boolean;
  /** Optional custom section order (used by DOCX export). */
  sectionOrder?: SectionKey[];
  /** The job this CV was tailored to, if it came from the Editing Room. */
  targetJob?: { title: string; company: string };
  profile: Profile;
  createdAt: string;
  updatedAt: string;
}

// ---------- Resume score ----------

export interface ScoreIssue {
  severity: "error" | "warning" | "tip";
  message: string;
  where?: string;
  /** The score category this issue counts against (matches ScoreCategory.label). */
  category?: string;
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


// ---------- Mock interview ----------

export interface InterviewFeedback {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface InterviewTurn {
  question: string;
  answer?: string;
  feedback?: InterviewFeedback;
}

// ---------- Conversational résumé assistant ----------

export type ResumeEditKind =
  | "summary"
  | "skills"
  | "title"
  | "bullet"
  | "addBullet";

/** A single, reviewable change the assistant proposes to the draft CV. */
export interface ResumeEdit {
  id: string;
  kind: ResumeEditKind;
  /** Index into profile.experience — for "bullet" and "addBullet". */
  expIndex?: number;
  /** Index into the role's newline-joined bullets — for "bullet". */
  bulletIndex?: number;
  /** Current text, captured for the before→after preview and Undo. */
  before?: string;
  /** Proposed new text. */
  value: string;
  /** One-line "why" shown on the edit card. */
  rationale: string;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  edits?: ResumeEdit[];
}

// ---------- Job matcher ----------

export type MatchVerdict = "strong" | "good" | "stretch" | "weak";

export interface JobMatch {
  id: string;
  company: string;
  title: string;
  fit: number; // 0-100
  verdict: MatchVerdict;
  reasons: string[];
  gaps: string[];
  jd: string;
}
