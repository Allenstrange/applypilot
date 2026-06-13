import {
  Search,
  FileText,
  Mail,
  Sparkles,
  ListChecks,
  MessageSquare,
  ClipboardList,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Search,
    title: "Job Analysis & ATS scan",
    desc: "Paste a job description and get a semantic match score, the keywords you're missing, and an ATS safety check on your CV.",
  },
  {
    icon: FileText,
    title: "CV tailoring",
    desc: "Edit your CV with per-bullet AI rewriting (STAR, impact, metrics) and a live preview that highlights matched keywords.",
  },
  {
    icon: Mail,
    title: "Cover letters",
    desc: "Generate structured, persuasive cover letters tailored to each role — subject, salutation, body, and sign-off, in seconds.",
  },
  {
    icon: Sparkles,
    title: "Resume summary booster",
    desc: "Punch up the top of your resume with a sharp headline, a dense summary, and metric-driven bullet points.",
  },
  {
    icon: ListChecks,
    title: "Interview prep coach",
    desc: "Turn the job description into tailored questions, answer frameworks built on your history, and insider coaching tips.",
  },
  {
    icon: MessageSquare,
    title: "Recruiter outreach",
    desc: "Draft warm, specific outreach messages to recruiters and hiring managers that reference real points of alignment.",
  },
  {
    icon: ClipboardList,
    title: "Application tracker",
    desc: "Track every application through Planned → Applied → Interview → Offer, reload past generations, and export to CSV.",
  },
  {
    icon: KeyRound,
    title: "Bring your own AI",
    desc: "Use OpenAI, Anthropic, Gemini, or any OpenAI-compatible endpoint. Your keys and data stay in your browser.",
  },
];

export interface Step {
  n: number;
  title: string;
  desc: string;
}

export const STEPS: Step[] = [
  {
    n: 1,
    title: "Build your profile",
    desc: "Upload your CV (DOCX or PDF) or fill it in — ApplyPilot structures it into a reusable master profile.",
  },
  {
    n: 2,
    title: "Analyse the job",
    desc: "Paste the job description to get a match score, keyword gaps, and an ATS safety scan before you write a word.",
  },
  {
    n: 3,
    title: "Tailor & generate",
    desc: "Rewrite bullets, and generate a cover letter, resume summary, interview prep, and outreach — all keyword-rich.",
  },
  {
    n: 4,
    title: "Track & apply",
    desc: "Save everything to your tracker, export clean PDFs, and move each application through your pipeline.",
  },
];
