import type React from 'react';
import type { FAQItem } from '../lander/components/FAQSection';

export type GrantProgramStatus = 'Active' | 'On hiatus';
export type GrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'technical-ai-safety-project-sprint' | 'incubator-week';

export type GrantProgramTrack = 'Funding' | 'Build' | 'Launch';

export type GrantProgramDefinition = {
  slug: GrantProgramSlug;
  title: string;
  href: string;
  status: GrantProgramStatus;
  /** Short track label shown above the program title (e.g. 'Funding', 'Build'). */
  track: GrantProgramTrack;
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
    track: 'Funding',
    goal: 'Fund talented people in the BlueDot community to do excellent work on AI safety - research, events, community building, and more.',
    scope: 'Grants up to $10,000 for project costs, events, travel, community building, and other costs that remove barriers. Fast decisions, lightweight process.',
    status: 'Active',
  },
  {
    slug: 'career-transition-grant',
    title: 'Career Transition Grants',
    href: '/programs/career-transition-grant',
    track: 'Funding',
    goal: 'Support BlueDot graduates to work full-time on impactful AI safety work.',
    scope: 'Funding plus intros, advising, and community for people ready to go full-time on AI safety.',
    status: 'Active',
  },
  {
    slug: 'technical-ai-safety-project-sprint',
    title: 'Technical AI Safety Project Sprint',
    href: '/courses/technical-ai-safety-project',
    track: 'Build',
    goal: 'Help technically minded people ship a concrete AI safety research or engineering project with expert support.',
    scope: 'A 30-hour project sprint with mentorship, public output, and a clear path to portfolio-building.',
    scopeLabel: 'Format',
    status: 'Active',
  },
  {
    slug: 'incubator-week',
    title: 'Incubator Week',
    href: '/courses/incubator-week',
    track: 'Launch',
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

/** Slugs that have a marketing page assembled from the shared section components. */
export type ConfigurableGrantProgramSlug = 'rapid-grants' | 'career-transition-grant';

export type GrantProgramSectionConfig = {
  applicationUrl: string;
  faqItems: FAQItem[];
};

export const GRANT_PROGRAM_SECTIONS: Record<ConfigurableGrantProgramSlug, GrantProgramSectionConfig> = {
  'rapid-grants': {
    applicationUrl: RAPID_GRANT_APPLICATION_URL,
    faqItems: [
      {
        id: 'unsure',
        question: 'Should I apply if I\'m not sure it\'s a fit?',
        answer: 'Yes. If the work\'s underway and the need is specific, just apply. Don\'t talk yourself out of it.',
      },
      {
        id: 'eligibility',
        question: 'Who is eligible?',
        answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you\'re in our network and doing serious AI safety work, you qualify.',
      },
      {
        id: 'events',
        question: 'Can Rapid Grants fund events or meetups?',
        answer: 'Yes. We have funded meetup series, venue costs, and community events in multiple countries. Show us the plan and the specific costs.',
      },
      {
        id: 'reimbursement',
        question: 'Do you fund upfront or reimburse later?',
        answer: 'Both. Usually we send the money upfront; sometimes we reimburse instead. We\'ll tell you which when we approve.',
      },
      {
        id: 'travel',
        question: 'Can Rapid Grants cover travel?',
        answer: 'Yes. We fund travel for conferences, collaboration, and fieldwork. Show us why being there matters for the work.',
      },
      {
        id: 'larger-request',
        question: 'What if I need more than a few thousand dollars?',
        answer: 'Rapid Grants run from $50 to $10,000. If you need more, get in touch. We can sometimes route you through another program.',
      },
    ],
  },
  'career-transition-grant': {
    applicationUrl: CAREER_TRANSITION_GRANT_APPLICATION_URL,
    faqItems: [
      {
        id: 'eligibility',
        question: 'Who is eligible?',
        answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you are in our network and doing excellent work on AI safety, you are likely eligible.',
      },
      {
        id: 'uncertain',
        question: 'Should I apply if I don\'t know exactly how to contribute to AI safety yet?',
        answer: 'Yes. We do not expect you to have it all figured out. We would rather see a clear-eyed account of what you do not know and a plan for finding out.',
      },
      {
        id: 'circumstances-change',
        question: 'What if I secure a full-time role or my circumstances change during the grant?',
        answer: 'Please let us know. Any remaining funds would be returned to BlueDot.',
      },
    ],
  },
};
