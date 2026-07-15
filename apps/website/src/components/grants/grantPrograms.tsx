import type { FAQItem } from '../lander/components/FAQSection';

export type GrantProgramStatus = 'Active' | 'On hiatus';
export type GrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'technical-ai-safety-project-sprint' | 'incubator-week' | 'fieldbuilder-week' | 'advising';

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
    slug: 'advising',
    title: '1-1 advising',
    href: '/programs/advising',
    track: 'Build',
    goal: 'Help BlueDot community members figure out how to contribute their skills to AI safety.',
    scope: 'A 30-minute call with the BlueDot team. Leave with concrete next steps.',
    status: 'Active',
  },
  {
    slug: 'incubator-week',
    title: 'Incubator Week',
    href: '/programs/incubator-week',
    track: 'Launch',
    goal: 'Back graduates launching AI safety startups, with grant funding and an intensive week in San Francisco.',
    scope: 'Cohort 5 runs in San Francisco, August 17–21. Apply by August 7 for a five-day sprint from idea to funded.',
    scopeLabel: 'Format',
    status: 'Active',
  },
];

/** Slugs that have a marketing page assembled from the shared section components. */
export type ConfigurableGrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'advising' | 'incubator-week' | 'fieldbuilder-week';

export type GrantProgramSectionConfig = {
  faqItems: FAQItem[];
};

export const GRANT_PROGRAM_SECTIONS: Record<ConfigurableGrantProgramSlug, GrantProgramSectionConfig> = {
  'rapid-grants': {
    faqItems: [
      {
        id: 'unsure',
        question: 'Should I apply if I\'m not sure it\'s a fit?',
        answer: 'Yes. If the work\'s underway and the need is specific, just apply. Don\'t talk yourself out of it.',
      },
      {
        id: 'eligibility',
        question: 'Who is eligible?',
        answer: (
          <>
            Everyone who wants to start working on AI safety and biosecurity.
            <br />
            <br />
            You're more likely to receive a grant if you're a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.
          </>
        ),
        answerText: 'Everyone who wants to start working on AI safety and biosecurity. You\'re more likely to receive a grant if you\'re a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.',
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
    faqItems: [
      {
        id: 'eligibility',
        question: 'Who is eligible?',
        answer: (
          <>
            Everyone who's ready to go full-time on AI safety and biosecurity.
            <br />
            <br />
            You're more likely to receive a grant if you're a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.
          </>
        ),
        answerText: 'Everyone who\'s ready to go full-time on AI safety and biosecurity. You\'re more likely to receive a grant if you\'re a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.',
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
      {
        id: 'masters-phd',
        question: 'Will you fund a Master\'s or PhD?',
        answer: 'Generally, no. For most people, a Master\'s or PhD isn\'t the most direct route to impactful AI safety work. There are exceptions. Mention it in your application if you think yours is one.',
      },
      {
        id: 'grant-structure',
        question: 'How is the grant structured?',
        answer: (
          <>
            The grant is a fellowship grant in support of your AI safety work. It is not a salary or a contract for services. BlueDot is a UK entity, so we don't issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us.
            <br />
            <br />
            We can't give tax advice, so please check the tax implications with a qualified advisor in your country.
          </>
        ),
        answerText: 'The grant is a fellowship grant in support of your AI safety work. It is not a salary or a contract for services. BlueDot is a UK entity, so we don\'t issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us. We can\'t give tax advice, so please check the tax implications with a qualified advisor in your country.',
      },
    ],
  },
  'incubator-week': {
    faqItems: [
      {
        id: 'solo-or-team',
        question: 'Can I apply solo or do I need a co-founder?',
        answer: 'Both work. Solo founders are welcome — though we\'ve learned that co-founder matching is hard, so coming with a partner (friend, classmate, existing co-founder) is a plus. We\'ll help facilitate connections during the week.',
      },
      {
        id: 'expenses',
        question: 'What expenses are covered?',
        answer: 'Everything. We\'ll fly you to San Francisco, provide accommodation, and cover all meals during the week. You just need to show up ready to build.',
      },
      {
        id: 'tracks',
        question: 'What tracks do you support?',
        answer: 'We support both nonprofit and for-profit startups in fields like AI safety, biosecurity, cybersecurity, and other catastrophic risk reduction. We are especially interested in policy entrepreneurship.',
      },
      {
        id: 'funding',
        question: 'How does the funding work?',
        answer: 'If we back your pitch, we will fund your immediate needs on the spot and—if you make good progress—give you up to $100k in grant funding within two weeks.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We&apos;re a nonprofit based in San Francisco. Since 2022, we&apos;ve trained over 8,000 people. Our courses are the main entry point into the AI safety field, with alumni now working at OpenAI, Anthropic, DeepMind, the UK AI Safety Institute, and many more.
            <br /><br />
            Incubator Week is our program for the most entrepreneurial participants — the ones ready to build the startups the world needs.
          </>
        ),
        answerText: 'We\'re a nonprofit based in San Francisco. Since 2022, we\'ve trained over 8,000 people. Our courses are the main entry point into the AI safety field, with alumni now working at OpenAI, Anthropic, DeepMind, the UK AI Safety Institute, and many more. Incubator Week is our program for the most entrepreneurial participants — the ones ready to build the startups the world needs.',
      },
    ],
  },
  'fieldbuilder-week': {
    faqItems: [],
  },
  advising: {
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
        id: 'no-options',
        question: 'Should I apply for a call if I don\'t have any options I\'m considering?',
        answer: (
          <>
            If you're new to AI safety, you should start with the <a href="https://bluedot.org/courses/future-of-ai" className="underline hover:no-underline">Future of AI course</a>.
            <br /><br />
            If you can&apos;t come up with any guesses for how you could contribute, you might want to consider taking the <a href="https://bluedot.org/courses/agi-strategy" className="underline hover:no-underline">AGI Strategy course</a> or our <a href="https://bluedot.org/courses" className="underline hover:no-underline">deep dive courses</a> to get a better sense of what&apos;s needed in AI safety.
          </>
        ),
        answerText: 'If you\'re new to AI safety, you should start with the Future of AI course. If you can\'t come up with any guesses for how you could contribute, you might want to consider taking the AGI Strategy course or our deep dive courses to get a better sense of what\'s needed in AI safety.',
      },
    ],
  },
};
