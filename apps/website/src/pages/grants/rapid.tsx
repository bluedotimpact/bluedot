import type React from 'react';
import {
  Breadcrumbs,
  P,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import GranteesListSection from '../../components/grants/GranteesListSection';
import GrantPageSection from '../../components/grants/GrantPageSection';
import GrantProgramHero from '../../components/grants/GrantProgramHero';
import GrantProgramViewTransitions from '../../components/grants/GrantProgramViewTransitions';
import { RAPID_GRANT_APPLICATION_URL } from '../../components/grants/grantPrograms';
import LandingBanner from '../../components/lander/components/LandingBanner';
import FAQSection from '../../components/lander/components/FAQSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Rapid Grants',
  url: '/grants/rapid',
  parentPages: [ROUTES.home, ROUTES.grants],
};

const DECISION_CARDS = [
  {
    title: 'Strong fit',
    body: 'You have already started the work, can point to a real blocker, and need a specific project cost covered.',
  },
  {
    title: 'Usually not a fit',
    body: 'Salary, living expenses, general-purpose equipment, or open-ended exploration without a concrete project need.',
  },
];

const FUNDED_EXAMPLES = [
  'Compute for technical AI safety work, including API credits and evaluation runs.',
  'Research access, such as paywalled papers, datasets, and project-relevant tools.',
  'Project-specific software, hosting, or participant recruitment for empirical studies.',
  'Conference travel when there is a concrete deliverable beyond networking.',
];

const NOT_FUNDED_EXAMPLES = [
  'Compensation for your time on the project.',
  'General-purpose equipment like laptops, phones, or storage devices.',
  'General productivity subscriptions without a project-specific case.',
  'Personal or living expenses.',
];

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Apply with evidence',
    body: (
      <>
        Show what you have already built, tested, or validated, plus the exact cost you want covered, in the{' '}
        <a
          href={RAPID_GRANT_APPLICATION_URL}
          className="font-medium text-bluedot-navy underline underline-offset-4"
        >
          application form
        </a>
        .
      </>
    ),
  },
  {
    number: '02',
    title: 'Get a decision',
    body: 'We usually reply within five working days and tell you what we are willing to fund.',
  },
  {
    number: '03',
    title: 'Receive funding',
    body: 'If accepted, we may send the money upfront as a grant or reimburse later, depending on the case.',
  },
  {
    number: '04',
    title: 'Use it for the approved purpose',
    body: 'Use the funding for the project costs we agreed on, and check with us if the plan changes materially.',
  },
];

const FAQ_ITEMS = [
  {
    id: 'unsure',
    question: 'Should I apply if I am not sure the request is a fit?',
    answer: 'Yes. If the project is already underway and the blocker is concrete, applying is usually better than self-screening out too early.',
  },
  {
    id: 'reimbursement',
    question: 'Do you fund upfront or reimburse later?',
    answer: 'Both. In many cases we are happy to send the money upfront as a grant, and in other cases we reimburse later.',
  },
  {
    id: 'travel',
    question: 'Can Rapid Grants cover conference travel?',
    answer: 'Sometimes, but the bar is high. We usually want a concrete deliverable such as presenting research or leading a session, not general networking or exploration.',
  },
  {
    id: 'larger-request',
    question: 'What if I need more than a small reimbursement?',
    answer: 'Rapid Grants is for relatively small, concrete project costs. If what you need is substantially larger, this is probably the wrong mechanism.',
  },
];

const RapidGrantsPage = () => {
  const { data: grantees } = trpc.grants.getAllPublicGrantees.useQuery();

  const scrollToGrantees = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    const granteesSection = document.getElementById('grants-made');
    if (!granteesSection) {
      return;
    }

    const navOffset = 96;
    const targetTop = granteesSection.getBoundingClientRect().top + window.scrollY - navOffset;

    window.history.replaceState(null, '', '#grants-made');
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const grantsMadeLabel = grantees ? String(grantees.length) : '—';
  const fundingGivenOut = grantees?.reduce((sum, grantee) => {
    return sum + (grantee.amountUsd ?? 0);
  }, 0);
  const fundingGivenOutLabel = typeof fundingGivenOut === 'number'
    ? formatAmountUsd(fundingGivenOut)
    : '—';

  return (
    <div className="bg-color-canvas">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Rapid small grants for BlueDot participants and facilitators working on concrete, high-leverage projects."
        />
      </Head>

      <GrantProgramViewTransitions />

      <GrantProgramHero
        slug="rapid"
        title="Rapid Grants"
        description="Fast, practical funding for BlueDot course participants and facilitators working on projects that are already in motion."
        status="Active"
        primaryCta={{ text: 'Apply now', url: RAPID_GRANT_APPLICATION_URL }}
        secondaryCta={{ text: 'Look at grantees', url: '#grants-made', onClick: scrollToGrantees }}
        facts={[
          { label: 'Typical grants', value: 'Up to $5k' },
          { label: 'Decision time', value: 'Around 5 working days' },
          { label: 'Grants made', value: grantsMadeLabel },
          { label: 'Funding given out', value: fundingGivenOutLabel },
        ]}
      />

      <Breadcrumbs route={CURRENT_ROUTE} />

      <GrantPageSection
        title="What this program is for"
        tone="canvas"
        contentClassName="flex flex-col gap-4"
      >
        <div className="max-w-[760px] flex flex-col gap-5">
          <P>After completing the learning phase of our courses, many participants work on independent projects of their choosing. We want these projects to be excellent, and we try to remove barriers wherever we can.</P>
          <P>One common barrier is lacking the resources to do the project well. Rapid Grants are aimed at people who, without funding, could not reasonably afford what they need for their chosen project.</P>
        </div>

        <div className="flex flex-col gap-3">
          {DECISION_CARDS.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-bluedot-navy/10 bg-white px-6 py-6 lg:px-8">
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
                <h3 className="text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-bluedot-navy">
                  {card.title}
                </h3>
                <P className="text-[15px] leading-[1.65] text-bluedot-navy/70">
                  {card.body}
                </P>
              </div>
            </div>
          ))}
        </div>

        <P className="max-w-[760px]">
          If you are unsure whether to apply, the default is simple:{' '}
          <a
            href={RAPID_GRANT_APPLICATION_URL}
            className="font-medium text-bluedot-navy underline underline-offset-4"
          >
            apply
          </a>
          .
        </P>
      </GrantPageSection>

      <GrantPageSection
        title="What we fund and what we usually do not"
        tone="canvas"
        contentClassName="flex flex-col gap-4"
      >
        <P className="max-w-[760px]">Rapid Grants has a quality bar. These are examples of the kinds of costs we often fund and usually do not fund, not a promise that every application of that type will be approved.</P>

        <div className="rounded-[24px] border border-[#D7E4F5] bg-[#F4F8FD] px-6 py-6 flex flex-col gap-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2A5FA8]">
            Fundable
          </p>
          <ul className="flex flex-col gap-4">
            {FUNDED_EXAMPLES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.65] text-bluedot-navy/76">
                <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-[#356DB1]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[24px] border border-[#E6D9C6] bg-[#FBF7F1] px-6 py-6 flex flex-col gap-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8B5A15]">
            Usually not funded through this program
          </p>
          <ul className="flex flex-col gap-4">
            {NOT_FUNDED_EXAMPLES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.65] text-bluedot-navy/76">
                <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-[#9F6A2A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </GrantPageSection>

      <GrantPageSection
        title="How it works"
        tone="canvas"
        contentClassName="flex flex-col gap-3"
      >
        {PROCESS_STEPS.map((step) => (
          <div key={step.title} className="rounded-[24px] border border-bluedot-navy/10 bg-white px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[96px_220px_1fr] lg:gap-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-bluedot-navy/40">
                {step.number}
              </p>
              <h3 className="text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-bluedot-navy">
                {step.title}
              </h3>
              <P className="text-[15px] leading-[1.65] text-bluedot-navy/70">
                {step.body}
              </P>
            </div>
          </div>
        ))}
      </GrantPageSection>

      <GranteesListSection
        id="grants-made"
        title="Projects we have funded"
        subtitle=""
        limit={6}
        background="canvas"
      />

      <FAQSection
        title="FAQ"
        items={FAQ_ITEMS}
        background="canvas"
      />

      <div className="pt-8 min-[680px]:pt-10 min-[1280px]:pt-12">
        <LandingBanner
          title="Apply for a Rapid Grant"
          ctaText="Apply now"
          ctaUrl={RAPID_GRANT_APPLICATION_URL}
          imageSrc="/images/courses/courses-gradient.webp"
          imageAlt="Rapid Grants banner"
          iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
          iconAlt="BlueDot icon"
          noiseImageSrc="/images/agi-strategy/noise.webp"
        />
      </div>
    </div>
  );
};

export default RapidGrantsPage;
