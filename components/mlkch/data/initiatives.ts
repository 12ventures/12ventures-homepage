import { formatRoiAmount, formatRoiAmountExact, SNAPSKILL_ROI_TOTAL } from './snapSkillRoi';
//
// All values are dummy data for the current static build.
// Future: replace METRICS / INITIATIVES with an async fetchDashboardData()
// call that pulls from the SnapSkill API and other initiative trackers.
// ---------------------------------------------------------------------------

const SNAPSKILL_QUIZ_FIRST_ATTEMPT = 49;
const SNAPSKILL_QUIZ_COMPLETION = 92;
const SNAPSKILL_COMPETENCY_IMPROVEMENT_RATE =
  SNAPSKILL_QUIZ_COMPLETION - SNAPSKILL_QUIZ_FIRST_ATTEMPT;
const SNAPSKILL_NURSES_ONBOARDED = 113;
const SNAPSKILL_CONTENT_MODULES = 2_348;

export interface DashboardMetrics {
  liveProjects: number;
  nursesOnboarded: number;
  dollarsSaved: number;
  valueCreated: number;
  lastUpdated: string;
}

export type InitiativeSectionSlug = 'live' | 'next' | 'backlog';
/** @deprecated Use InitiativeSectionSlug — kept for static seed data only */
export type InitiativeSection = InitiativeSectionSlug;
export type InitiativeStatus  = 'active' | 'planning' | 'backlog';
export type MetricAccent      = 'teal' | 'sky' | 'purple' | 'green';

export interface InitiativeSectionRef {
  id: string;
  slug: string;
  label: string;
}

export interface DashboardSection extends InitiativeSectionRef {
  sortOrder: number;
  accentColor: string;
  dotPulse: boolean;
}

export const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'sec_live', slug: 'live', label: 'Live', sortOrder: 0, accentColor: '#2dd4bf', dotPulse: true },
  { id: 'sec_next', slug: 'next', label: 'Next', sortOrder: 10, accentColor: '#38bdf8', dotPulse: false },
  { id: 'sec_backlog', slug: 'backlog', label: 'Backlog', sortOrder: 20, accentColor: '#64748b', dotPulse: false },
];

export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function accentUiFromColor(accentColor: string) {
  const rgb = hexToRgb(accentColor);
  return {
    text: accentColor,
    bg: `rgba(${rgb},0.08)`,
    border: `rgba(${rgb},0.25)`,
    rgb,
  };
}

export function resolveSectionAccent(
  initiative: Initiative,
  sections: DashboardSection[] = DEFAULT_SECTIONS,
) {
  const match =
    sections.find((s) => s.id === initiative.sectionId) ??
    sections.find((s) => s.slug === initiative.section.slug);
  return accentUiFromColor(match?.accentColor ?? '#64748b');
}

export function defaultStatusForSectionSlug(slug: string): InitiativeStatus {
  if (slug === 'live') return 'active';
  if (slug === 'next') return 'planning';
  return 'backlog';
}

export interface InitiativeMetric {
  label: string;
  value: string;
  opensRoiBreakdown?: boolean;
}

export interface TopMetric {
  label: string;
  value: string;
  accent: MetricAccent;
  opensRoiBreakdown?: boolean;
}

export interface MilestoneLink {
  label: string;
  url: string;
}

export interface MilestoneGroup {
  label: string;
  children: MilestoneChild[];
}

export type MilestoneChild = string | MilestoneLink;

export type MilestoneItem = string | MilestoneLink | MilestoneGroup;

export function isMilestoneGroup(item: MilestoneItem): item is MilestoneGroup {
  return typeof item === 'object' && 'children' in item;
}

export function milestoneLabel(item: MilestoneChild | MilestoneItem): string {
  return typeof item === 'string' ? item : item.label;
}

export function milestoneUrl(item: MilestoneChild | MilestoneItem): string | undefined {
  return typeof item === 'string' ? undefined : isMilestoneGroup(item) ? undefined : item.url;
}

export interface Initiative {
  id: string;
  title: string;
  sectionId: string;
  section: InitiativeSectionRef;
  status: InitiativeStatus;
  description: string;
  sortOrder?: number;
  topMetrics: TopMetric[];   // drives the top KPI row when selected
  subItems?: MilestoneItem[];
  metrics?: InitiativeMetric[];
  tags?: string[];
  /** Optional hero image shown behind the detail panel with a top-to-bottom fade */
  bannerImage?: string;
  /** Optional external product or demo link shown next to the title */
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
  { label: 'Nurses Onboarded', value: '113', accent: 'sky' },
  {
    label: 'Competency Improvement and Retention',
    value: `${SNAPSKILL_COMPETENCY_IMPROVEMENT_RATE}%`,
    accent: 'green',
  },
  {
    label: 'ROI',
    value: formatRoiAmount(SNAPSKILL_ROI_TOTAL),
    accent: 'purple',
    opensRoiBreakdown: true,
  },
];

// ---------------------------------------------------------------------------
// Initiative data (static fallback — sectionSlug mapped to sectionId on export)
// ---------------------------------------------------------------------------
type RawInitiative = Omit<Initiative, 'sectionId' | 'section'> & {
  sectionSlug: InitiativeSectionSlug;
};

function withSection(raw: RawInitiative): Initiative {
  const def = DEFAULT_SECTIONS.find((s) => s.slug === raw.sectionSlug)!;
  const { sectionSlug, ...rest } = raw;
  return {
    ...rest,
    sectionId: def.id,
    section: { id: def.id, slug: def.slug, label: def.label },
  };
}

const RAW_INITIATIVES: RawInitiative[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  {
    id: 'snapskill-onboarding',
    title: 'SnapSkill Onboarding',
    sectionSlug: 'live',
    status: 'active',
    bannerImage: 'https://games.dreambox.gg/snapskill/logos/mlk-front-entrance.jpg',
    description:
      'AI-powered onboarding program for MLKCH nursing staff, transforming dense policy documents and workflows into engaging, bite-sized learning modules delivered via SnapSkill.',
    topMetrics: [
      { label: 'Nurses Onboarded', value: '113', accent: 'sky' },
      {
        label: 'Competency Improvement and Retention',
        value: `${SNAPSKILL_COMPETENCY_IMPROVEMENT_RATE}%`,
        accent: 'green',
      },
      {
        label: 'ROI',
        value: formatRoiAmount(SNAPSKILL_ROI_TOTAL),
        accent: 'purple',
        opensRoiBreakdown: true,
      },
    ],
    subItems: [
      `${SNAPSKILL_NURSES_ONBOARDED} nurses onboarded to date`,
      `${SNAPSKILL_CONTENT_MODULES.toLocaleString()} content modules transformed to adaptive modern multimedia`,
      `${SNAPSKILL_COMPETENCY_IMPROVEMENT_RATE}% increase in competency and retention`,
      `${formatRoiAmountExact(SNAPSKILL_ROI_TOTAL)} in annual direct and indirect ROI`,
    ],
    metrics: [
      { label: 'Nurses Onboarded',    value: '113'       },
      { label: 'Avg Completion Rate', value: '96%'       },
      {
        label: 'Quiz Performance - First Attempt',
        value: `${SNAPSKILL_QUIZ_FIRST_ATTEMPT}%`,
      },
      {
        label: 'Quiz Performance - Completion',
        value: `${SNAPSKILL_QUIZ_COMPLETION}%`,
      },
      {
        label: 'Competency Improvement and Retention',
        value: `${SNAPSKILL_COMPETENCY_IMPROVEMENT_RATE}%`,
      },
      {
        label: 'ROI',
        value: formatRoiAmount(SNAPSKILL_ROI_TOTAL),
        opensRoiBreakdown: true,
      },
    ],
    tags: ['SnapSkill', 'Nursing', 'AI Content', 'Live'],
  },

  // ── Next ──────────────────────────────────────────────────────────────────
  {
    id: 'msp-transition',
    title: 'Managed Services Provider (MSP) Transition',
    sectionSlug: 'next',
    status: 'planning',
    bannerImage: '/images/operator_banner_wide.png',
    description:
      'Structured transition to a Managed Services Provider model, enabling MLKCH to scale AI initiatives with 12 Ventures as the long-term delivery partner.',
    topMetrics: [
      { label: 'Phase',            value: 'Planning',  accent: 'sky'    },
      { label: 'Target Completion', value: 'July 2026', accent: 'teal'   },
      { label: 'Projected Value',  value: '$80K',      accent: 'purple' },
    ],
    subItems: [
      'Validate Change Management Methodology',
      'Communication Plan',
    ],
    metrics: [
      { label: 'Phase',          value: 'Planning' },
      { label: 'Target Completion', value: 'July 2026' },
    ],
    tags: ['MSP', 'Change Management', 'Strategy'],
  },
  {
    id: 'snapskill-modules',
    title: 'SnapSkill Additional Modules',
    sectionSlug: 'next',
    status: 'planning',
    bannerImage: 'https://games.dreambox.gg/snapskill/logos/mlk-front-entrance.jpg',
    description:
      'Expanding the SnapSkill module library for MLKCH with targeted updates, an Ask AI feature for just-in-time answers, and full EHR systems training.',
    topMetrics: [
      { label: 'New Modules',   value: '3',         accent: 'sky'  },
      { label: 'Target Launch', value: 'July 2026', accent: 'teal' },
    ],
    subItems: [
      {
        label: 'Targeted Updates',
        url: 'https://staging.snapskill.ai/o/mlkch/continuous-reinforcement',
      },
      {
        label: 'Ask AI',
        url: 'https://staging.snapskill.ai/o/mlkch/ask',
      },
      'EHR Training',
    ],
    metrics: [
      { label: 'New Modules Planned', value: '3'         },
      { label: 'Target Launch',       value: 'July 2026' },
    ],
    tags: ['SnapSkill', 'EHR', 'Ask AI', 'Content'],
  },
  {
    id: 'cedars-sinai-visit',
    title: 'Cedars-Sinai Site Visit',
    sectionSlug: 'next',
    status: 'planning',
    bannerImage:
      'https://www.cedars-sinai.org/content/dam/cedars-sinai/locations-images/Surgery_8700_Beverly_01.jpg',
    description:
      'Cedars-Sinai is visiting MLKCH to see firsthand the AI advancements and workforce innovations powered by 12 Ventures, a recognition of MLKCH\'s progress as an AI-forward health system.',
    topMetrics: [
      { label: 'Visit Date',     value: 'July 2026', accent: 'sky'    },
      { label: 'Phase',          value: 'Scheduling', accent: 'teal'   },
      { label: 'Orgs Involved',  value: '2',          accent: 'purple' },
    ],
    subItems: [
      'Showcase AI Transformation Program',
      'AI Learning + Workforce Performance',
      {
        label: 'Phase 1: Onboarding',
        children: ['SnapSkill Onboarding', 'EHR Training'],
      },
      {
        label: 'Phase 2: Continuous Reinforcement',
        children: ['Targeted Updates', 'Ask AI'],
      },
      'Phase 3: AI Workflow Transformation',
      'Strategic Partnership Discussion',
    ],
    metrics: [
      { label: 'Visit Date', value: 'July 2026' },
    ],
    tags: ['Benchmarking', 'Site Visit', 'Research'],
  },
  {
    id: 'conexiones',
    title: 'Conexiones',
    sectionSlug: 'next',
    status: 'planning',
    bannerImage: '/images/conexiones_banner.png',
    externalUrl: 'https://staging.snapskill.io/p/conexiones',
    description:
      'Community health AI initiative targeting underserved patient populations, exploring AI-assisted outreach, multilingual content delivery, and care coordination.',
    topMetrics: [
      { label: 'Phase',           value: 'Discovery', accent: 'sky'    },
      { label: 'Target Live',     value: 'July 2026', accent: 'teal'   },
      { label: 'Projected Value', value: '$50K+',     accent: 'purple' },
    ],
    subItems: [
      {
        label: 'Patient Engagement multimedia content',
        children: [
          'Medi-Cal Literacy on Cost',
          'Open Access Schedule - Evening, Weekends, Last-Minute Booking Available',
          'Transportation Support (Theme: No car? We\'ll cover your transportation)',
          'Break Generational Exhaustion (Theme: You\'re not being selfish by taking care of your health)',
        ],
      },
      'Patient Engagement App Product',
      'Partner with MLKCH and HealthBegins for Patient Engagement App Distribution',
    ],
    metrics: [
      { label: 'Phase',       value: 'Discovery' },
      { label: 'Target Live', value: 'July 2026' },
    ],
    tags: ['Community Health', 'Multilingual', 'Outreach'],
  },

  // ── Backlog ───────────────────────────────────────────────────────────────
  {
    id: 'patient-engagement',
    title: 'Patient Engagement',
    sectionSlug: 'backlog',
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
    sectionSlug: 'backlog',
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
    sectionSlug: 'backlog',
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
    sectionSlug: 'backlog',
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
    sectionSlug: 'backlog',
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

export const INITIATIVES: Initiative[] = RAW_INITIATIVES.map(withSection);

export const DEFAULT_BACKLOG_BANNER = '/images/tech_banner.png';

export function resolveInitiativeBanner(initiative: Initiative): string | undefined {
  return initiative.bannerImage ?? (initiative.section.slug === 'backlog' ? DEFAULT_BACKLOG_BANNER : undefined);
}

export function getInitiativesBySectionId(
  sectionId: string,
  initiatives: Initiative[] = INITIATIVES,
): Initiative[] {
  return initiatives
    .filter((i) => i.sectionId === sectionId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/** @deprecated Use getInitiativesBySectionId */
export function getInitiativesBySection(
  sectionSlug: InitiativeSectionSlug,
  initiatives: Initiative[] = INITIATIVES,
): Initiative[] {
  const def = DEFAULT_SECTIONS.find((s) => s.slug === sectionSlug);
  if (!def) return [];
  return getInitiativesBySectionId(def.id, initiatives);
}
