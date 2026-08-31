import type { FAQItem } from '../lander/components/FAQSection';

export type GrantProgramStatus = 'Active' | 'On hiatus';
export type GrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'technical-ai-safety-project-sprint' | 'incubator-week' | 'fieldbuilder-week' | 'context-week' | 'advising';

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
    href: '/grants/rapid',
    track: 'Funding',
    goal: 'Fund talented people in the BlueDot community to do excellent work on AI safety - research, events, community building, and more.',
    scope: 'Grants up to $10,000 for project costs, events, travel, community building, and other costs that remove barriers. Fast decisions, lightweight process.',
    status: 'Active',
  },
  {
    slug: 'career-transition-grant',
    title: 'Career Transition Grants',
    href: '/grants/career-transition',
    track: 'Funding',
    goal: 'Support people making full-time transitions into work that reduces catastrophic risks from advanced AI or biological threats.',
    scope: 'Funding, advising, targeted connections, and community for a defined period of evidence-producing personal transition.',
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
    href: '/grants/career-transition',
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
    scope: 'Cohort 5 runs in San Francisco, August 24–28. Apply by August 14 for a five-day sprint from idea to funded.',
    scopeLabel: 'Format',
    status: 'Active',
  },
];

/** Slugs that have a marketing page assembled from the shared section components. */
export type ConfigurableGrantProgramSlug = 'rapid-grants' | 'career-transition-grant' | 'advising' | 'incubator-week' | 'fieldbuilder-week' | 'context-week';

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
        question: 'Who should apply?',
        answer: (
          <>
            <span className="block mb-3">Apply if you:</span>
            <span className="block mb-2">• Are ready to work full-time on a personal transition</span>
            <span className="block mb-2">• Can point to evidence of relevant ability or recent momentum</span>
            <span className="block mb-2">• Have a plausible plan for producing work, testing a path or moving into a contribution</span>
            <span className="block mb-2">• Can explain how success could contribute to reducing catastrophic risks from advanced AI or biological threats</span>
            <span className="block mb-4">• Believe funding would meaningfully improve the transition</span>
            <span className="block">Applications are open to everyone. Prior participation in a BlueDot course or community is not required.</span>
          </>
        ),
        answerText: 'Apply if you are ready to work full-time on a personal transition, can point to evidence of relevant ability or recent momentum, have a plausible plan for producing work, testing a path or moving into a contribution, can explain how success could contribute to reducing catastrophic risks from advanced AI or biological threats, and believe funding would meaningfully improve the transition. Applications are open to everyone. Prior participation in a BlueDot course or community is not required.',
      },
      {
        id: 'funding-need',
        question: 'Do I need to be unable to transition without funding?',
        answer: 'No. We do not require the transition to be literally impossible without BlueDot. We do want to understand what funding would change—for example, whether it lets you begin sooner, work full-time, take a more ambitious path or produce stronger evidence before making your next career decision.',
      },
      {
        id: 'work-sample',
        question: 'Do I need an AI safety work sample?',
        answer: 'Relevant AI safety or biosecurity work is the most useful evidence, but strong analogous work can also be informative. If you do not yet have a work sample, you may still apply; explain what other evidence we should use to assess your ability.',
      },
      {
        id: 'rapid-grants',
        question: 'Should I apply to Rapid Grants instead?',
        answer: 'Rapid Grants are usually a better fit when you have a concrete project with specific costs—such as research, an event, travel, compute or tooling—and need up to $10,000. Career Transition Grants are for a period of full-time personal transition. If you are unsure, apply to the route that seems closest and we can redirect you.',
      },
      {
        id: 'uncertain',
        question: 'Should I apply if I don\'t know exactly how to contribute to AI safety yet?',
        answer: 'Yes. We do not expect a fixed career plan or certainty about every step. We do expect a serious hypothesis, a way to test it and a plan that can produce useful work or information even if the original path does not work.',
      },
      {
        id: 'circumstances-change',
        question: 'What if I secure a full-time role or my circumstances change during the grant?',
        answer: 'Please let us know. Any remaining funds would be returned to BlueDot.',
      },
      {
        id: 'masters-phd',
        question: 'Will you fund a Master\'s or PhD?',
        answer: 'Generally, no. For most people, a Master\'s or PhD isn\'t the most direct route to impactful AI safety or biosecurity work. There are exceptions. Mention it in your application if you think yours is one.',
      },
      {
        id: 'grant-structure',
        question: 'How is the grant structured?',
        answer: (
          <>
            The grant is a fellowship grant in support of your AI safety or biosecurity transition. It is not a salary or a contract for services. BlueDot is a UK entity, so we don't issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us.
            <br />
            <br />
            We can't give tax advice, so please check the tax implications with a qualified advisor in your country.
          </>
        ),
        answerText: 'The grant is a fellowship grant in support of your AI safety or biosecurity transition. It is not a salary or a contract for services. BlueDot is a UK entity, so we don\'t issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us. We can\'t give tax advice, so please check the tax implications with a qualified advisor in your country.',
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
            We&apos;re a nonprofit based in San Francisco. Since 2022, we&apos;ve trained over 10,000 people. Our courses are the main entry point into the AI safety field, with alumni now working at OpenAI, Anthropic, DeepMind, the UK AI Safety Institute, and many more.
            <br /><br />
            Incubator Week is our program for the most entrepreneurial participants — the ones ready to build the startups the world needs.
          </>
        ),
        answerText: 'We\'re a nonprofit based in San Francisco. Since 2022, we\'ve trained over 10,000 people. Our courses are the main entry point into the AI safety field, with alumni now working at OpenAI, Anthropic, DeepMind, the UK AI Safety Institute, and many more. Incubator Week is our program for the most entrepreneurial participants — the ones ready to build the startups the world needs.',
      },
    ],
  },
  'fieldbuilder-week': {
    faqItems: [],
  },
  'context-week': {
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
