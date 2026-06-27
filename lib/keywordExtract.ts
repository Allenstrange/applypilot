// ============== LOCAL JD KEYWORD EXTRACTION (no AI, no network) ==============
// Pulls the most salient skill/tech tokens out of a job description, tags each
// by category, and counts how often it appears. This is a "Track A" signal:
// instant, free, offline — a useful preview before (or without) an AI analysis.

export type KeywordCategory =
  | "Cloud"
  | "Data"
  | "Infrastructure"
  | "Languages"
  | "Frameworks & Libraries"
  | "Tools"
  | "Methods"
  | "General";

export interface ExtractedKeyword {
  /** Canonical display form, e.g. "PostgreSQL". */
  token: string;
  category: KeywordCategory;
  /** Occurrences in the job description. */
  count: number;
  /** Density target: 2 when the JD emphasises it (3+ mentions), else 1. */
  required: number;
}

export interface CategoryGroup {
  category: KeywordCategory;
  keywords: ExtractedKeyword[];
}

/**
 * Curated dictionary: lowercase phrase -> { display, category }. Includes
 * multi-word and symbol-bearing terms (ci/cd, node.js, c#, power bi) that a
 * naive tokenizer would miss or split.
 */
const KNOWN: Record<string, { display: string; category: KeywordCategory }> = {};
function add(category: KeywordCategory, entries: [string, string][]) {
  for (const [phrase, display] of entries) KNOWN[phrase] = { display, category };
}

add("Cloud", [
  ["aws", "AWS"], ["amazon web services", "AWS"], ["azure", "Azure"],
  ["gcp", "GCP"], ["google cloud", "Google Cloud"], ["ec2", "EC2"], ["s3", "S3"],
  ["lambda", "Lambda"], ["cloudformation", "CloudFormation"], ["serverless", "Serverless"],
]);
add("Infrastructure", [
  ["kubernetes", "Kubernetes"], ["k8s", "Kubernetes"], ["docker", "Docker"],
  ["terraform", "Terraform"], ["ansible", "Ansible"], ["jenkins", "Jenkins"],
  ["ci/cd", "CI/CD"], ["linux", "Linux"], ["networking", "Networking"],
  ["tcp/ip", "TCP/IP"], ["dns", "DNS"], ["active directory", "Active Directory"],
  ["vmware", "VMware"], ["nginx", "Nginx"], ["windows server", "Windows Server"],
  ["office 365", "Office 365"], ["azure ad", "Azure AD"], ["dhcp", "DHCP"],
  ["vpn", "VPN"], ["sccm", "SCCM"], ["intune", "Intune"], ["dhcp/dns", "DHCP"],
]);
add("Data", [
  ["sql", "SQL"], ["postgresql", "PostgreSQL"], ["postgres", "PostgreSQL"],
  ["mysql", "MySQL"], ["mongodb", "MongoDB"], ["redis", "Redis"], ["etl", "ETL"],
  ["power bi", "Power BI"], ["tableau", "Tableau"], ["spark", "Spark"],
  ["hadoop", "Hadoop"], ["snowflake", "Snowflake"], ["bigquery", "BigQuery"],
  ["data analysis", "Data analysis"], ["machine learning", "Machine learning"],
  ["pandas", "pandas"], ["numpy", "NumPy"], ["data warehouse", "Data warehousing"],
]);
add("Languages", [
  ["python", "Python"], ["java", "Java"], ["javascript", "JavaScript"],
  ["typescript", "TypeScript"], ["golang", "Go"], ["c++", "C++"], ["c#", "C#"],
  [".net", ".NET"], ["ruby", "Ruby"], ["php", "PHP"], ["rust", "Rust"],
  ["kotlin", "Kotlin"], ["swift", "Swift"], ["scala", "Scala"], ["bash", "Bash"],
  ["powershell", "PowerShell"], ["sql server", "SQL Server"],
]);
add("Frameworks & Libraries", [
  ["react", "React"], ["angular", "Angular"], ["vue", "Vue"], ["node.js", "Node.js"],
  ["nodejs", "Node.js"], ["next.js", "Next.js"], ["express", "Express"],
  ["django", "Django"], ["flask", "Flask"], ["spring", "Spring"],
  ["rails", "Rails"], ["tensorflow", "TensorFlow"], ["pytorch", "PyTorch"],
  ["graphql", "GraphQL"], ["rest", "REST"], ["microservices", "Microservices"],
]);
add("Tools", [
  ["git", "Git"], ["github", "GitHub"], ["gitlab", "GitLab"], ["jira", "Jira"],
  ["confluence", "Confluence"], ["figma", "Figma"], ["excel", "Excel"],
  ["salesforce", "Salesforce"], ["servicenow", "ServiceNow"], ["zendesk", "Zendesk"],
]);
add("Methods", [
  ["agile", "Agile"], ["scrum", "Scrum"], ["kanban", "Kanban"], ["devops", "DevOps"],
  ["tdd", "TDD"], ["itil", "ITIL"],
]);
add("General", [
  ["communication", "Communication"], ["leadership", "Leadership"],
  ["stakeholder", "Stakeholder management"], ["troubleshooting", "Troubleshooting"],
  ["customer service", "Customer service"], ["collaboration", "Collaboration"],
  ["problem solving", "Problem solving"], ["mentoring", "Mentoring"],
]);

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "this", "that",
  "have", "from", "will", "their", "they", "them", "has", "was", "but", "not",
  "all", "can", "any", "who", "what", "when", "able", "into", "such", "able",
  "work", "working", "role", "team", "teams", "experience", "years", "year",
  "ability", "strong", "good", "skills", "knowledge", "including", "etc",
  "across", "within", "using", "use", "used", "well", "must", "should", "would",
  "job", "company", "candidate", "candidates", "looking", "join", "help",
  "support", "new", "other", "more", "also", "per", "based", "plus", "while",
  // generic JD filler that adds noise as "keywords"
  "line", "provide", "providing", "desirable", "issues", "issue", "requests",
  "incidents", "responsibilities", "requirements", "required", "complex",
  "clear", "multiple", "internal", "external", "escalate", "participate",
  "aligned", "manage", "management", "service", "services", "ensure", "deliver",
  "environment", "environments", "various", "relevant", "related", "tasks",
  "duties", "role", "roles", "level", "levels", "first", "second", "third",
]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Count non-overlapping occurrences of a phrase with token-aware boundaries. */
function countOccurrences(haystack: string, phrase: string): number {
  const re = new RegExp(
    `(?<![a-z0-9+#.])${escapeRe(phrase)}(?![a-z0-9+#.])`,
    "gi",
  );
  const m = haystack.match(re);
  return m ? m.length : 0;
}

const CATEGORY_ORDER: KeywordCategory[] = [
  "Languages",
  "Frameworks & Libraries",
  "Cloud",
  "Data",
  "Infrastructure",
  "Tools",
  "Methods",
  "General",
];

/**
 * Extract up to `limit` salient keywords from a job description. Known skills
 * are matched and categorised; unrecognised but frequently-repeated tokens are
 * captured as "General" so domain terms aren't lost.
 */
export function extractKeywords(jd: string, limit = 24): ExtractedKeyword[] {
  const text = (jd || "").toLowerCase();
  if (text.trim().length < 30) return [];

  const found = new Map<string, ExtractedKeyword>();
  // Words that belong to a matched known phrase, so the frequency fallback
  // doesn't re-surface them (e.g. "active"/"directory" from "Active Directory").
  const consumed = new Set<string>();

  // 1. Known dictionary terms (accurate display + category).
  for (const phrase of Object.keys(KNOWN)) {
    const count = countOccurrences(text, phrase);
    if (count === 0) continue;
    const { display, category } = KNOWN[phrase];
    for (const part of `${phrase} ${display.toLowerCase()}`.split(/[^a-z0-9]+/)) {
      if (part.length >= 3) consumed.add(part);
    }
    const existing = found.get(display);
    if (existing) {
      existing.count += count;
    } else {
      found.set(display, { token: display, category, count, required: 1 });
    }
  }

  // 2. Frequency fallback for unknown, repeated tokens (domain terms).
  const freq = new Map<string, number>();
  for (const raw of text.split(/[^a-z0-9.+#]+/)) {
    const tok = raw.replace(/^[.]+|[.]+$/g, "");
    if (tok.length < 4 || STOP_WORDS.has(tok) || /^\d+$/.test(tok)) continue;
    if (KNOWN[tok] || consumed.has(tok)) continue; // already captured
    freq.set(tok, (freq.get(tok) ?? 0) + 1);
  }
  for (const [tok, count] of freq) {
    if (count < 2) continue; // density indicator only
    const display = tok.charAt(0).toUpperCase() + tok.slice(1);
    if (found.has(display)) continue;
    found.set(display, { token: display, category: "General", count, required: 1 });
  }

  // 3. Finalise required (emphasis) and rank by count.
  const list = Array.from(found.values()).map((k) => ({
    ...k,
    required: k.count >= 3 ? 2 : 1,
  }));
  list.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
  return list.slice(0, limit);
}

/** Group extracted keywords by category in a stable display order. */
export function groupByCategory(keywords: ExtractedKeyword[]): CategoryGroup[] {
  const byCat = new Map<KeywordCategory, ExtractedKeyword[]>();
  for (const k of keywords) {
    const arr = byCat.get(k.category) ?? [];
    arr.push(k);
    byCat.set(k.category, arr);
  }
  return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((category) => ({
    category,
    keywords: byCat.get(category)!,
  }));
}
