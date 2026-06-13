// ============== KEYWORD ENGINE ==============

const IT_KEYWORDS = [
  "active directory", "azure ad", "azure", "office 365", "o365", "microsoft 365", "m365",
  "sccm", "intune", "endpoint", "windows 10", "windows 11", "windows server",
  "servicenow", "jira", "zendesk", "powershell", "bash", "scripting", "automation",
  "tcp/ip", "dhcp", "dns", "vpn", "lan", "wan", "wi-fi", "wifi", "network", "firewall",
  "exchange", "outlook", "teams", "sharepoint", "onedrive", "vmware", "hyper-v",
  "itil", "gdpr", "compliance", "security", "troubleshooting", "diagnostics", "incident",
  "1st line", "2nd line", "3rd line", "customer service", "stakeholder", "communication",
  "ticketing", "escalation", "comptia", "md-102", "az-900", "az-104", "itil foundation",
  "sql", "python", "api", "cloud", "aws", "gcp", "agile", "scrum",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Local keyword extraction fallback (used when no AI provider is configured). */
export function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of IT_KEYWORDS) {
    const regex = new RegExp("\\b" + escapeRegExp(kw) + "\\b", "i");
    if (regex.test(lower)) found.push(kw);
  }
  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) ?? [];
  return [...new Set([...found, ...acronyms.map((a) => a.toLowerCase())])];
}

/**
 * Build a case-insensitive, word-boundary regex from keywords.
 * Keywords are sorted descending by length so longer phrases match before
 * their substrings (e.g. "Active Directory" before "Directory").
 */
export function buildKeywordRegex(keywords: string[]): RegExp | null {
  const cleaned = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];
  if (cleaned.length === 0) return null;
  const sorted = cleaned.sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegExp).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}
