// ============== ATS DETECTION (no AI, no network) ==============
// Most job-posting URLs give away which applicant tracking system the company
// runs, because the big ATS vendors host the postings on their own domains.
// Knowing the system lets us give targeted, practical advice.

export interface ATSInfo {
  /** Vendor name, e.g. "Workday". */
  name: string;
  /** Practical, system-specific advice (original guidance, no vendor copy). */
  tips: string[];
}

const GENERIC_TIPS = [
  "Mirror the JD's exact wording for key skills — many ATS searches are literal.",
  "Keep section headings standard (Experience, Education, Skills) so parsing stays clean.",
];

// Hostname fragment -> ATS. Checked in order; first match wins.
const ATS_SIGNATURES: [string, ATSInfo][] = [
  ["myworkdayjobs.com", {
    name: "Workday",
    tips: [
      "Workday re-parses your CV into its own form — after uploading, check every auto-filled field and fix parsing mistakes before submitting.",
      "Use one job title per role line; Workday's parser splits combined titles badly.",
      "Expect a per-company account: the details you save are reused for every application at that employer.",
    ],
  }],
  ["greenhouse.io", {
    name: "Greenhouse",
    tips: [
      "Greenhouse shows recruiters your actual PDF, so visual polish matters more here than in most systems.",
      "Keyword search is recruiter-driven — cover the JD's exact skill terms at least once each.",
    ],
  }],
  ["lever.co", {
    name: "Lever",
    tips: [
      "Lever stores your CV as a searchable document — the recruiter often finds you later by keyword, so include synonyms (e.g. both 'CI/CD' and 'continuous integration').",
      "The application form is short; your CV carries almost all the signal here.",
    ],
  }],
  ["taleo.net", {
    name: "Taleo",
    tips: [
      "Taleo's keyword matching is close to exact-match — mirror the JD's phrasing precisely, including plurals.",
      "Its parser is strict and dated: avoid tables, columns, and graphics entirely.",
      "Fill in every optional form field; Taleo ranks completeness.",
    ],
  }],
  ["icims.com", {
    name: "iCIMS",
    tips: [
      "iCIMS relies on knockout screening questions — answer them with the JD's own terminology.",
      "Keep dates in a consistent 'MMM YYYY' format; its parser builds a timeline from them.",
    ],
  }],
  ["successfactors", {
    name: "SAP SuccessFactors",
    tips: [
      "SuccessFactors profiles are long forms — budget time and copy from your CV verbatim so the form and PDF agree.",
      "Recruiters filter by the skills you type into its skills fields; list the JD's hard skills there, not just in the CV.",
    ],
  }],
  ["smartrecruiters.com", {
    name: "SmartRecruiters",
    tips: [
      "SmartRecruiters scores applicants against the posting's listed skills — make sure each listed requirement appears on your CV.",
    ],
  }],
  ["ashbyhq.com", {
    name: "Ashby",
    tips: [
      "Ashby is popular with startups: applications go straight to hiring managers, so the summary at the top of your CV does the heavy lifting.",
    ],
  }],
  ["bamboohr.com", {
    name: "BambooHR",
    tips: [
      "BambooHR postings are usually read by a human, not filtered — clarity and brevity beat keyword density here.",
    ],
  }],
  ["workable.com", {
    name: "Workable",
    tips: [
      "Workable surfaces an AI-generated profile summary from your CV — a strong opening summary paragraph transfers directly.",
    ],
  }],
  ["teamtailor.com", {
    name: "Teamtailor",
    tips: [
      "Teamtailor is conversion-focused and light on filtering — a tailored cover note carries unusual weight.",
    ],
  }],
  ["recruitee.com", {
    name: "Recruitee",
    tips: [
      "Recruitee pipelines are tag-based — the skills you mention become recruiter search tags, so name technologies explicitly.",
    ],
  }],
  ["jobvite.com", {
    name: "Jobvite",
    tips: [
      "Jobvite weights referral applications heavily — if you know anyone at the company, apply through them.",
    ],
  }],
];

/** Detect the ATS behind a job-posting URL. Returns null when unrecognised. */
export function detectATS(url: string | undefined | null): ATSInfo | null {
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [fragment, info] of ATS_SIGNATURES) {
    if (host.includes(fragment)) {
      return { ...info, tips: [...info.tips, ...GENERIC_TIPS] };
    }
  }
  return null;
}
