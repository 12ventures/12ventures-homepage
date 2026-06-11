// ---------------------------------------------------------------------------
// MLKCH x 12 Ventures – Dashboard Data
//
// All values are dummy data for the current static build.
// Future: replace METRICS / INITIATIVES with an async fetchDashboardData()
// call that pulls from the SnapSkill API and other initiative trackers.
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  liveProjects: number;
  nursesOnboarded: number;
  dollarsSaved: number;
  valueCreated: number;
  lastUpdated: string;
}

export type InitiativeSection = 'live' | 'next' | 'backlog';
export type InitiativeStatus  = 'active' | 'planning' | 'backlog';
export type MetricAccent      = 'teal' | 'sky' | 'purple' | 'green';

export interface InitiativeMetric {
  label: string;
  value: string;
}

export interface TopMetric {
  label: string;
  value: string;
  accent: MetricAccent;
}

export interface Initiative {
  id: string;
  title: string;
  section: InitiativeSection;
  status: InitiativeStatus;
  description: string;
  topMetrics: TopMetric[];   // drives the top KPI row when selected
  subItems?: string[];
  metrics?: InitiativeMetric[];
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Global KPI metrics (fallback / overview state)
// ---------------------------------------------------------------------------
export const METRICS: DashboardMetrics = {
  liveProjects: 1,
  nursesOnboarded: 113,
  dollarsSaved: 127_000,
  valueCreated: 185_000,
  lastUpdated: '2026-06-11',
};

export const GLOBAL_TOP_METRICS: TopMetric[] = [
  { label: 'Nurses Onboarded', value: '113',   accent: 'sky'    },
  { label: 'Est. Savings',     value: '$127K',  accent: 'green'  },
  { label: 'Value Created',    value: '$185K',  accent: 'purple' },
];

// ---------------------------------------------------------------------------
// Initiative data
// ---------------------------------------------------------------------------
export const INITIATIVES: Initiative[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  {
    id: 'snapskill-onboarding',
    title: 'SnapSkill Onboarding',
    section: 'live',
    status: 'active',
    description:
      'AI-powered onboarding program for MLKCH nursing staff, transforming dense policy documents and workflows into engaging, bite-sized learning modules delivered via SnapSkill.',
    topMetrics: [
      { label: 'Nurses Onboarded', value: '113',   accent: 'sky'    },
      { label: 'Est. Savings',     value: '$127K',  accent: 'green'  },
      { label: 'Value Created',    value: '$185K',  accent: 'purple' },
    ],
    subItems: [
      '113 nurses onboarded to date',
      'Custom MLKCH module library',
      'Ongoing content refresh cadence',
    ],
    metrics: [
      { label: 'Nurses Onboarded',       value: '113'       },
      { label: 'Avg Completion Rate',    value: '91%'       },
      { label: 'Est. Time Saved',        value: '2x faster' },
      { label: 'Annual ROI Est.',        value: '$127K'     },
    ],
    tags: ['SnapSkill', 'Nursing', 'AI Content', 'Live'],
  },

  // ── Next ──────────────────────────────────────────────────────────────────
  {
    id: 'msp-transition',
    title: 'Managed Services Partner (MSP) Transition',
    section: 'next',
    status: 'planning',
    description:
      'Structured transition to a Managed Services Partner model, enabling MLKCH to scale AI initiatives with 12 Ventures as the long-term delivery partner.',
    topMetrics: [
      { label: 'Phase',            value: 'Planning',  accent: 'sky'    },
      { label: 'Target Kickoff',   value: 'Q3 2026',   accent: 'teal'   },
      { label: 'Projected Value',  value: '$80K',      accent: 'purple' },
    ],
    subItems: [
      'Validate Change Management Methodology',
      'Communication Plan',
    ],
    metrics: [
      { label: 'Phase',          value: 'Planning' },
      { label: 'Target Kickoff', value: 'Q3 2026'  },
    ],
    tags: ['MSP', 'Change Management', 'Strategy'],
  },
  {
    id: 'snapskill-modules',
    title: 'SnapSkill Modules Expansion',
    section: 'next',
    status: 'planning',
    description:
      'Expanding the SnapSkill module library for MLKCH with targeted updates, an Ask AI feature for just-in-time answers, and full EHR systems training.',
    topMetrics: [
      { label: 'New Modules',        value: '8+',       accent: 'sky'   },
      { label: 'Projected Savings',  value: '$35K',     accent: 'green' },
      { label: 'Target Launch',      value: 'Q3 2026',  accent: 'teal'  },
    ],
    subItems: [
      'Targeted Updates: refresh existing content',
      'Ask AI: real-time question answering against module content',
      'EHR Training: Epic/Cerner system navigation modules',
    ],
    metrics: [
      { label: 'New Modules Planned', value: '8+'      },
      { label: 'Target Launch',       value: 'Q3 2026' },
    ],
    tags: ['SnapSkill', 'EHR', 'Ask AI', 'Content'],
  },
  {
    id: 'cedars-sinai-visit',
    title: 'Cedars-Sinai Site Visit',
    section: 'next',
    status: 'planning',
    description:
      'Cedars-Sinai is visiting MLKCH to see firsthand the AI advancements and workforce innovations powered by 12 Ventures, a recognition of MLKCH\'s progress as an AI-forward health system.',
    topMetrics: [
      { label: 'Visit Date',     value: 'Q3 2026',   accent: 'sky'    },
      { label: 'Phase',          value: 'Scheduling', accent: 'teal'   },
      { label: 'Orgs Involved',  value: '2',          accent: 'purple' },
    ],
    subItems: [
      'Showcase SnapSkill onboarding program',
      'Demonstrate AI-powered workflow improvements',
      'Cross-system knowledge exchange and debrief',
    ],
    metrics: [
      { label: 'Visit Date', value: 'Q3 2026' },
    ],
    tags: ['Benchmarking', 'Site Visit', 'Research'],
  },
  {
    id: 'conexiones',
    title: 'Conexiones',
    section: 'next',
    status: 'planning',
    description:
      'Community health AI initiative targeting underserved patient populations, exploring AI-assisted outreach, multilingual content delivery, and care coordination.',
    topMetrics: [
      { label: 'Phase',            value: 'Discovery', accent: 'sky'    },
      { label: 'Target Launch',    value: 'Q4 2026',   accent: 'teal'   },
      { label: 'Projected Value',  value: '$50K+',     accent: 'purple' },
    ],
    subItems: [
      'Multilingual AI content strategy',
      'Community health worker enablement',
      'Pilot program design',
    ],
    metrics: [
      { label: 'Phase', value: 'Discovery' },
    ],
    tags: ['Community Health', 'Multilingual', 'Outreach'],
  },

  // ── Backlog ───────────────────────────────────────────────────────────────
  {
    id: 'patient-engagement',
    title: 'Patient Engagement',
    section: 'backlog',
    status: 'backlog',
    description:
      'AI-driven patient engagement platform with personalized communications, appointment reminders, post-discharge follow-ups, and satisfaction surveys at scale.',
    topMetrics: [
      { label: 'Target',             value: 'Est. 2027', accent: 'sky'    },
      { label: 'Projected Savings',  value: '$200K+',    accent: 'green'  },
      { label: 'Projected Value',    value: '$350K',     accent: 'purple' },
    ],
    tags: ['Patient Experience', 'Automation', 'Messaging'],
  },
  {
    id: 'contracts-intelligence',
    title: 'Contracts Intelligence Dashboard',
    section: 'backlog',
    status: 'backlog',
    description:
      'AI-powered contract analysis and monitoring, automatically surfacing renewal dates, compliance obligations, cost anomalies, and vendor performance signals.',
    topMetrics: [
      { label: 'Target',             value: 'Q4 2026', accent: 'sky'    },
      { label: 'Projected Savings',  value: '$150K',   accent: 'green'  },
      { label: 'Projected Value',    value: '$280K',   accent: 'purple' },
    ],
    tags: ['Contracts', 'Legal', 'Finance', 'Analytics'],
  },
  {
    id: 'miscoded-reimbursement',
    title: 'Miscoded Reimbursement Entries',
    section: 'backlog',
    status: 'backlog',
    description:
      'Revenue integrity tool using AI to detect miscoded EHR billing entries, recovering lost reimbursement revenue and improving compliance.',
    topMetrics: [
      { label: 'Recovery Rate',    value: '3-5%',   accent: 'teal'   },
      { label: 'Revenue Recovery', value: '$300K+', accent: 'green'  },
      { label: 'Projected Value',  value: '$500K',  accent: 'purple' },
    ],
    tags: ['Revenue Cycle', 'EHR', 'Compliance', 'Finance'],
  },
  {
    id: 'mpp-automation',
    title: 'Management Performance Plan (MPP) Automation',
    section: 'backlog',
    status: 'backlog',
    description:
      'Automates the creation, tracking, and reporting of Management Performance Plans, reducing administrative overhead and surfacing real-time performance signals.',
    topMetrics: [
      { label: 'Admin Time Saved',  value: '80%',   accent: 'teal'   },
      { label: 'Projected Savings', value: '$80K',  accent: 'green'  },
      { label: 'Projected Value',   value: '$120K', accent: 'purple' },
    ],
    tags: ['HR', 'Automation', 'Performance Management'],
  },
  {
    id: 'mlkch-messaging',
    title: 'MLKCH DM / Messaging Social Network',
    section: 'backlog',
    status: 'backlog',
    description:
      'Internal AI-enabled messaging and social network for MLKCH staff, facilitating knowledge sharing, peer support, and real-time clinical communication.',
    topMetrics: [
      { label: 'Scope',            value: 'All Staff', accent: 'sky'    },
      { label: 'Target Launch',    value: '2027',      accent: 'teal'   },
      { label: 'Projected Value',  value: '$60K',      accent: 'purple' },
    ],
    tags: ['Internal Comms', 'Social', 'Knowledge Sharing'],
  },
];

// ---------------------------------------------------------------------------
// Helper: group initiatives by section (preserves order)
// ---------------------------------------------------------------------------
export function getInitiativesBySection(section: InitiativeSection): Initiative[] {
  return INITIATIVES.filter((i) => i.section === section);
}
