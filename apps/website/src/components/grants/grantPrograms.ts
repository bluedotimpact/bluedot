import type React from 'react';

export type GrantProgramStatus = 'Active' | 'On hiatus';
export type GrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'technical-ai-safety-project-sprint' | 'incubator-week';

export type GrantProgramDefinition = {
  slug: GrantProgramSlug;
  title: string;
  href: string;
  status: GrantProgramStatus;
  goal: string;
  scope: string;
  scopeLabel?: string;
};

export const RAPID_GRANT_APPLICATION_URL = 'https://airtable.com/appMVNtdBtvtJvu5E/pag9G3oF4DYAyassX/form';
export const CAREER_TRANSITION_GRANT_APPLICATION_URL = 'https://airtable.com/appMVNtdBtvtJvu5E/pagyKD4M0wd0ci2gH/form';

export const GRANT_PROGRAMS: GrantProgramDefinition[] = [
  {
    slug: 'rapid-grants',
    title: 'Rapid Grants',
    href: '/programs/rapid-grants',
    goal: 'Fund talented people in the BlueDot community to do excellent work on AI safety - research, events, community building, and more.',
    scope: 'Grants up to $10,000 for project costs, events, travel, community building, and other costs that remove barriers. Fast decisions, lightweight process.',
    status: 'Active',
  },
  {
    slug: 'career-transition-grant',
    title: 'Career Transition Grants',
    href: '/programs/career-transition-grant',
    goal: 'Support BlueDot graduates to work full-time on impactful AI safety work.',
    scope: 'Funding plus intros, advising, and community for people ready to go full-time on AI safety.',
    status: 'Active',
  },
  {
    slug: 'technical-ai-safety-project-sprint',
    title: 'Technical AI Safety Project Sprint',
    href: '/courses/technical-ai-safety-project',
    goal: 'Help technically minded people ship a concrete AI safety research or engineering project with expert support.',
    scope: 'A 30-hour project sprint with mentorship, public output, and a clear path to portfolio-building.',
    scopeLabel: 'Format',
    status: 'Active',
  },
  {
    slug: 'incubator-week',
    title: 'Incubator Week',
    href: '/courses/incubator-week',
    goal: 'Back founders from our courses to turn strong ideas into organizations that can make AI go well.',
    scope: 'A five-day intensive in London. All expenses paid. Pitch for funding on Friday.',
    scopeLabel: 'Format',
    status: 'On hiatus',
  },
];

export const STATUS_CLASS_MAP: Record<GrantProgramStatus, string> = {
  Active: 'border-[#356DB1]/12 bg-[#EEF5FD] text-[#1F4F89]',
  'On hiatus': 'border-[#B85A70]/12 bg-[#FCF1F4] text-[#8B3147]',
};

export const STATUS_DOT_CLASS_MAP: Record<GrantProgramStatus, string> = {
  Active: 'bg-[#356DB1]',
  'On hiatus': 'bg-[#B85A70]',
};

export const SURFACE_CLASS_MAP: Record<GrantProgramStatus, { panel: string; glow: string; line: string }> = {
  Active: {
    panel: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(243,248,254,0.98)_100%)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(89,153,229,0.14),transparent_52%)]',
    line: 'bg-[linear-gradient(180deg,#C8DCF7_0%,#E5EEF8_100%)]',
  },
  'On hiatus': {
    panel: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(252,242,245,0.98)_100%)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(197,94,120,0.16),transparent_52%)]',
    line: 'bg-[linear-gradient(180deg,#E7C2CC_0%,#F2E6EA_100%)]',
  },
};

type ViewTransitionPart = 'surface' | 'title' | 'status';

export const getGrantProgramViewTransitionStyle = (
  slug: GrantProgramSlug,
  part: ViewTransitionPart,
): React.CSSProperties => ({
  viewTransitionName: `grant-program-${slug}-${part}`,
});
