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

export type ProviderId = "openai" | "anthropic" | "gemini" | "custom";

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

export interface Application {
  id: number;
  company: string;
  title: string;
  location?: string;
  url?: string;
  status: ApplicationStatus;
  createdAt: string;
  notes?: string;
}
