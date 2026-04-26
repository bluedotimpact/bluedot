import type React from 'react';
import type { FAQItem } from '../lander/components/FAQSection';

export type GrantProgramStatus = 'Active' | 'On hiatus';
export type GrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'technical-ai-safety-project-sprint' | 'incubator-week' | '1-1-advising';

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
export const ONE_ON_ONE_ADVISING_APPLICATION_URL = 'https://web.miniextensions.com/elMoT4tTN0jx49tNB0cS';

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
  {
    slug: '1-1-advising',
    title: '1-1 advising',
    href: '/programs/1-1-advising',
    track: 'Build',
    goal: 'Help BlueDot community members figure out how to contribute their skills to AI safety.',
    scope: 'A 20-minute call with the BlueDot team. Leave with concrete next steps.',
    status: 'Active',
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
export type ConfigurableGrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | '1-1-advising';

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
  '1-1-advising': {
    applicationUrl: ONE_ON_ONE_ADVISING_APPLICATION_URL,
    faqItems: [
      {
        id: 'no-bluedot-course',
        question: 'Do I need to have done a BlueDot course to apply?',
        answer: 'No. We\'re excited to have advising calls with you if you\'ve engaged with AI safety through other channels.',
      },
      {
        id: 'rejected',
        question: 'What if I get rejected?',
        answer: 'If a call isn\'t the right fit for you now, we\'ll point you to other resources which might be more appropriate like our courses, events or programs. You can always reapply.',
      },
      {
        id: 'apply-again',
        question: 'After I\'ve had one call, can I apply again?',
        answer: 'Yes.',
      },
      {
        id: 'after-call',
        question: 'What happens after the call?',
        answer: 'Most calls end with a 20-minute follow-up scheduled in 1-2 weeks, plus specific things to do in between. Sometimes the next step is just things you can go do on your own.',
      },
      {
        id: 'no-options',
        question: 'Should I apply for a call if I don\'t have any options I\'m considering?',
        answer: (
          <>
            If you haven&apos;t seriously considered the risks from advanced AI systems before, you should take the <a href="https://bluedot.org/courses/future-of-ai" className="underline hover:no-underline">Future of AI course</a>.
            <br /><br />
            If you can&apos;t come up with any guesses for how you could contribute, you might want to consider taking the <a href="https://bluedot.org/courses/agi-strategy" className="underline hover:no-underline">AGI Strategy course</a> or our <a href="https://bluedot.org/courses" className="underline hover:no-underline">deep dive courses</a> to get a better sense of what&apos;s needed in AI safety.
          </>
        ),
      },
    ],
  },
};
