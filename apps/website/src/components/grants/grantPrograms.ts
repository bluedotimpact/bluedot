import type React from 'react';

export type GrantProgramStatus = 'Active' | 'Closed' | 'In development';
export type GrantProgramSlug = 'rapid' | 'agi-strategy-fund' | 'bridge';

export type GrantProgramDefinition = {
  slug: GrantProgramSlug;
  title: string;
  href: string;
  status: GrantProgramStatus;
  goal: string;
  scope: string;
  scopeLabel?: string;
  summary: string;
};

export const RAPID_GRANT_APPLICATION_URL = 'https://airtable.com/appMVNtdBtvtJvu5E/pag9G3oF4DYAyassX/form';

export const GRANT_PROGRAMS: GrantProgramDefinition[] = [
  {
    slug: 'rapid',
    title: 'Rapid Grants',
    href: '/grants/rapid',
    goal: 'Remove concrete blockers so promising work that is already underway can move faster.',
    scope: 'Small grants up to $5,000 for project costs such as compute, research access, software, hosting, or narrowly justified travel. Designed to be fast, clear, and lightweight.',
    summary: 'Live small grants for concrete project costs when a project is already underway.',
    status: 'Active',
  },
  {
    slug: 'agi-strategy-fund',
    title: 'AGI Strategy Fund',
    href: '/grants/agi-strategy-fund',
    goal: 'Back high-impact AI safety projects and new organizations coming out of the AGI Strategy Course.',
    scope: '$200k+ given out across 9 grants, with grant sizes ranging from $5k to $50k.',
    scopeLabel: 'Results',
    summary: 'A closed, thesis-driven fund. The page now works as a short archive and framing layer.',
    status: 'Closed',
  },
  {
    slug: 'bridge',
    title: 'The Bridge',
    href: '/grants/bridge',
    goal: 'Back exceptional people to leave their current career and go full-time on AI safety.',
    scope: 'Career transition grants for people with a strong track record who are ready to go all-in on AI safety or Biosecurity.',
    summary: 'Selective, fast, and designed around the conviction that one of the field\'s biggest bottlenecks is getting the right people to go all-in.',
    status: 'In development',
  },
];

export const STATUS_CLASS_MAP: Record<GrantProgramStatus, string> = {
  Active: 'border-[#356DB1]/12 bg-[#EEF5FD] text-[#1F4F89]',
  Closed: 'border-[#B85A70]/12 bg-[#FCF1F4] text-[#8B3147]',
  'In development': 'border-[#7B8EA9]/12 bg-[#F4F7FB] text-[#52637B]',
};

export const STATUS_DOT_CLASS_MAP: Record<GrantProgramStatus, string> = {
  Active: 'bg-[#356DB1]',
  Closed: 'bg-[#B85A70]',
  'In development': 'bg-[#7B8EA9]',
};

export const SURFACE_CLASS_MAP: Record<GrantProgramStatus, { panel: string; glow: string; line: string }> = {
  Active: {
    panel: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(243,248,254,0.98)_100%)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(89,153,229,0.14),transparent_52%)]',
    line: 'bg-[linear-gradient(180deg,#C8DCF7_0%,#E5EEF8_100%)]',
  },
  Closed: {
    panel: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(252,242,245,0.98)_100%)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(197,94,120,0.16),transparent_52%)]',
    line: 'bg-[linear-gradient(180deg,#E7C2CC_0%,#F2E6EA_100%)]',
  },
  'In development': {
    panel: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,248,252,0.98)_100%)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(123,142,169,0.12),transparent_52%)]',
    line: 'bg-[linear-gradient(180deg,#D9E2EE_0%,#ECEFF5_100%)]',
  },
};

const VIEW_TRANSITION_PARTS = {
  surface: 'surface',
  title: 'title',
  status: 'status',
} as const;

export const getGrantProgramViewTransitionName = (
  slug: GrantProgramSlug,
  part: keyof typeof VIEW_TRANSITION_PARTS,
) => {
  return `grant-program-${slug}-${VIEW_TRANSITION_PARTS[part]}`;
};

export const getGrantProgramViewTransitionStyle = (
  slug: GrantProgramSlug,
  part: keyof typeof VIEW_TRANSITION_PARTS,
): React.CSSProperties => ({
  viewTransitionName: getGrantProgramViewTransitionName(slug, part),
});
