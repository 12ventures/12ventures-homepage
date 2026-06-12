// SnapSkill Onboarding ROI — sourced from MLKCH onboarding savings model
// Conservative totals per MLKCH CFO guidance (Steve)

export interface ROIBreakdownRow {
  label: string;
  value: string;
  variant?: 'default' | 'subtotal' | 'total';
}

export interface ROIBreakdown {
  initiativeId: string;
  title: string;
  total: number;
  sourceUrl?: string;
  sourceLabel?: string;
  rows: ROIBreakdownRow[];
}

export function formatRoiAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return m % 1 === 0 ? `$${m}M` : `$${m.toFixed(2)}M`.replace(/\.?0+$/, '');
  }
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toLocaleString()}`;
}

export function formatRoiAmountExact(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/** Total annual direct onboarding savings (conservative) */
export const SNAPSKILL_ROI_DIRECT = 259_200;

/** Total annual indirect value — MLKCH staff time freed */
export const SNAPSKILL_ROI_INDIRECT = 168_480;

/** Total annual direct + indirect ROI with SnapSkill */
export const SNAPSKILL_ROI_TOTAL = SNAPSKILL_ROI_DIRECT + SNAPSKILL_ROI_INDIRECT;

export const SNAPSKILL_ROI_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1BpxDKWW12x8rNpV9u72IPfEI-zRGeGhDiV7SxzU_EXU/edit?usp=sharing';

export const SNAPSKILL_ROI_BREAKDOWN: ROIBreakdown = {
  initiativeId: 'snapskill-onboarding',
  title: 'SnapSkill Onboarding ROI',
  total: SNAPSKILL_ROI_TOTAL,
  sourceUrl: SNAPSKILL_ROI_SOURCE_URL,
  sourceLabel: 'Link to ROI source calculation',
  rows: [
    {
      label: 'Total Annual Onboarding Direct Savings',
      value: formatRoiAmountExact(SNAPSKILL_ROI_DIRECT),
      variant: 'subtotal',
    },
    {
      label:
        'Total Annual Indirect Onboarding Value with SnapSkill (MLKCH Staff Free up Time)',
      value: formatRoiAmountExact(SNAPSKILL_ROI_INDIRECT),
      variant: 'subtotal',
    },
    {
      label: 'Total Annual Direct and Indirect ROI Value with SnapSkill',
      value: formatRoiAmountExact(SNAPSKILL_ROI_TOTAL),
      variant: 'total',
    },
  ],
};

export function getRoiBreakdown(initiativeId: string): ROIBreakdown | null {
  if (initiativeId === 'snapskill-onboarding') return SNAPSKILL_ROI_BREAKDOWN;
  return null;
}
