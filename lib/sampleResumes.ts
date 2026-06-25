// Sample resumes per job role. These drive the template gallery so users can
// preview each template filled with realistic content for a chosen role —
// the same pattern FlowCV / Kickresume use for their "browse templates" view.

import type { Profile } from "./types";

export interface SamplePersona {
  id: string;
  /** Label shown in the role switcher. */
  role: string;
  profile: Profile;
}

export const SAMPLE_PERSONAS: SamplePersona[] = [
  {
    id: "software-engineer",
    role: "Software Engineer",
    profile: {
      name: "Alex Carter",
      title: "Senior Software Engineer",
      email: "alex.carter@email.com",
      phone: "+1 (415) 555-0142",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexcarter",
      summary:
        "Full-stack engineer with 7+ years building scalable web platforms. Specialises in TypeScript, React and distributed backends, with a track record of shipping products used by millions and mentoring high-performing teams.",
      skills:
        "TypeScript · React · Node.js · Go · PostgreSQL · AWS · Kubernetes · GraphQL · CI/CD · System Design",
      certs: "AWS Certified Solutions Architect – Associate\nCKA: Certified Kubernetes Administrator",
      experience: [
        {
          company: "Stripe",
          role: "Senior Software Engineer",
          start: "2021",
          end: "Present",
          bullets:
            "Led migration of the payments dashboard to React Server Components, cutting page load time by 43%.\nDesigned an event-driven ledger service handling 12k transactions/sec at 99.99% uptime.\nMentored 5 engineers; introduced a code-review rubric that reduced production incidents by 30%.",
          tools: "TypeScript, React, Go, Kafka, AWS",
        },
        {
          company: "Airbnb",
          role: "Software Engineer",
          start: "2018",
          end: "2021",
          bullets:
            "Built the host onboarding flow that lifted activation conversion by 18%.\nReduced API p95 latency from 800ms to 210ms by introducing a caching layer and query batching.",
          tools: "React, Node.js, MySQL, Redis",
        },
      ],
      education: [
        { institution: "University of California, Berkeley", degree: "B.S. Computer Science", year: "2018" },
      ],
    },
  },
  {
    id: "finance-manager",
    role: "Finance Manager",
    profile: {
      name: "Priya Sharma",
      title: "Finance Manager",
      email: "priya.sharma@email.com",
      phone: "+44 20 7946 0321",
      location: "London, UK",
      linkedin: "linkedin.com/in/priyasharma",
      summary:
        "Qualified finance manager (ACCA) with 9 years across FP&A, reporting and controls in fast-scaling businesses. Partners with leadership to turn financial data into decisions, having led budgeting for a £120M P&L.",
      skills:
        "FP&A · Budgeting & Forecasting · Financial Modelling · IFRS · SAP · Power BI · Variance Analysis · Stakeholder Management",
      certs: "ACCA – Association of Chartered Certified Accountants\nAdvanced Financial Modelling (CFI)",
      experience: [
        {
          company: "Unilever",
          role: "Finance Manager",
          start: "2020",
          end: "Present",
          bullets:
            "Owned the annual budgeting cycle for a £120M division, improving forecast accuracy to within 3%.\nAutomated monthly reporting in Power BI, cutting close time from 8 days to 3.\nIdentified £4.2M in cost savings through margin and supplier analysis.",
          tools: "SAP, Power BI, Excel, Anaplan",
        },
        {
          company: "PwC",
          role: "Senior Financial Analyst",
          start: "2016",
          end: "2020",
          bullets:
            "Delivered FP&A support across a portfolio of FTSE-250 clients.\nBuilt three-statement models used in board-level investment decisions.",
          tools: "Excel, Tableau, Oracle",
        },
      ],
      education: [
        { institution: "London School of Economics", degree: "BSc Accounting & Finance", year: "2016" },
      ],
    },
  },
  {
    id: "product-manager",
    role: "Product Manager",
    profile: {
      name: "Jordan Lee",
      title: "Senior Product Manager",
      email: "jordan.lee@email.com",
      phone: "+1 (212) 555-0188",
      location: "New York, NY",
      linkedin: "linkedin.com/in/jordanlee",
      summary:
        "Product manager with 8 years taking B2B and consumer products from discovery to scale. Obsessed with customer problems and crisp prioritisation; shipped features driving $30M+ in incremental ARR.",
      skills:
        "Product Strategy · Roadmapping · A/B Testing · User Research · SQL · Figma · Jira · Go-to-Market · Stakeholder Alignment",
      certs: "Pragmatic Institute – Product Management Certified (PMC-III)",
      experience: [
        {
          company: "Notion",
          role: "Senior Product Manager",
          start: "2021",
          end: "Present",
          bullets:
            "Owned the collaboration suite; grew weekly active teams by 55% in 18 months.\nLaunched an AI writing assistant adopted by 2M users in the first quarter.\nRan a continuous discovery cadence with 40+ customer interviews per quarter.",
          tools: "Amplitude, Figma, SQL, Jira",
        },
        {
          company: "Dropbox",
          role: "Product Manager",
          start: "2017",
          end: "2021",
          bullets:
            "Defined the sharing roadmap that increased file-share conversion by 22%.\nPartnered with design and eng to ship a redesigned mobile upload flow.",
          tools: "Mixpanel, Figma, Looker",
        },
      ],
      education: [
        { institution: "Stanford University", degree: "B.A. Economics", year: "2015" },
      ],
    },
  },
  {
    id: "registered-nurse",
    role: "Registered Nurse",
    profile: {
      name: "Maria Gonzalez",
      title: "Registered Nurse, BSN",
      email: "maria.gonzalez@email.com",
      phone: "+1 (305) 555-0173",
      location: "Miami, FL",
      linkedin: "linkedin.com/in/mariagonzalezrn",
      summary:
        "Compassionate registered nurse with 6 years in acute and critical care. Known for calm clinical judgement under pressure, strong patient advocacy, and consistently high patient-satisfaction scores.",
      skills:
        "Critical Care · IV Therapy · Patient Assessment · EHR (Epic) · Medication Administration · BLS/ACLS · Care Planning · Patient Education",
      certs: "RN License – State of Florida\nACLS & BLS (American Heart Association)\nCCRN – Critical Care Registered Nurse",
      experience: [
        {
          company: "Jackson Memorial Hospital",
          role: "ICU Registered Nurse",
          start: "2020",
          end: "Present",
          bullets:
            "Manage care for up to 4 critically ill patients per shift in a 24-bed ICU.\nReduced central-line infection rates by 35% as part of a unit quality initiative.\nPrecept new graduate nurses through the unit's residency programme.",
          tools: "Epic EHR, Ventilator management, Hemodynamic monitoring",
        },
        {
          company: "Baptist Health South Florida",
          role: "Medical-Surgical Nurse",
          start: "2018",
          end: "2020",
          bullets:
            "Delivered post-operative care across a 32-bed med-surg unit.\nMaintained a 98% patient-satisfaction score across consecutive quarters.",
          tools: "Cerner EHR, Wound care",
        },
      ],
      education: [
        { institution: "University of Florida", degree: "Bachelor of Science in Nursing (BSN)", year: "2018" },
      ],
    },
  },
];

export function getPersona(id: string): SamplePersona {
  return SAMPLE_PERSONAS.find((p) => p.id === id) ?? SAMPLE_PERSONAS[0];
}
