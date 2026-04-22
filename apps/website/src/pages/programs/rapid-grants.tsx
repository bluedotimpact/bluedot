import type React from 'react';
import {
  Breadcrumbs,
  P,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { Nav } from '../../components/Nav/Nav';
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
  url: '/programs/rapid-grants',
  parentPages: [ROUTES.home, ROUTES.programs],
};

const DECISION_CARDS = [
  {
    title: 'Good fit',
    accentClassName: 'bg-[#356DB1]',
    eyebrowClassName: 'text-[#2A5FA8]',
    body: 'You are doing something concrete - a research project, an event series, community building, or fieldwork - and a specific cost is the bottleneck. We fund compute and API credits, events and meetups, research access, travel, community chapters, project tooling, and high-impact wildcard projects that do not fit a category yet.',
  },
  {
    title: 'Use judgment',
    accentClassName: 'bg-[#7B8EA9]',
    eyebrowClassName: 'text-[#52637B]',
    body: 'General-purpose equipment, productivity subscriptions, or vague plans without evidence of work already underway. Stipends and living expenses are not our default, but we consider them for high-impact work - apply and make the argument.',
  },
];

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Apply',
    url: RAPID_GRANT_APPLICATION_URL,
    body: 'Tell us what you are doing, what you need, and how much it costs. Five minutes, no lengthy proposals.',
  },
  {
    number: '02',
    title: 'Get a decision',
    body: 'We usually reply within five working days.',
  },
  {
    number: '03',
    title: 'Get paid',
    body: 'We pay upfront by default. In some cases we reimburse after - we will tell you which.',
  },
  {
    number: '04',
    title: 'Do the work',
    body: 'Use the funding for what we agreed on. If your plans change materially, let us know.',
  },
  {
    number: '05',
    title: 'Share your impact',
    body: 'A short update when the work is done - what you did, what came of it. No formal report, just close the loop.',
  },
];

const FAQ_ITEMS = [
  {
    id: 'unsure',
    question: 'Should I apply if I am not sure the request is a fit?',
    answer: 'Yes. If the work is underway and the need is concrete, applying is usually better than self-screening out too early.',
  },
  {
    id: 'eligibility',
    question: 'Who is eligible?',
    answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you are in our network and doing excellent work on AI safety, you are likely eligible.',
  },
  {
    id: 'events',
    question: 'Can Rapid Grants fund events or meetups?',
    answer: 'Yes. We have funded meetup series, venue costs, and community events in multiple countries. Show us the plan and the specific costs.',
  },
  {
    id: 'reimbursement',
    question: 'Do you fund upfront or reimburse later?',
    answer: 'Both. In many cases we send the money upfront as a grant, and in other cases we reimburse later.',
  },
  {
    id: 'travel',
    question: 'Can Rapid Grants cover travel?',
    answer: 'Yes. We fund travel for conferences, collaboration, and fieldwork. Show us why being there matters for the work.',
  },
  {
    id: 'larger-request',
    question: 'What if I need more than a few thousand dollars?',
    answer: 'Rapid Grants typically range from $50 to $10,000. If your need is substantially larger, get in touch - we may be able to help through another program.',
  },
];

const COMMUNITY_CARD = {
  eyebrow: 'Beyond the grant',
  title: 'Community',
  body: 'We keep a community of grantees, and depending on the work and timing, we may invite grant recipients into programming, events, or other opportunities.',
};

const RapidGrantsPage = () => {
  // Hero stats come from the operational endpoint so they reflect total program
  // activity, not just the subset of grantees that consented to public listing.
  // The "Projects we have funded" list below fetches its own data.
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();

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

  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingGivenOutLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Fast, flexible grants for BlueDot community members working on AI safety - research, events, community building, and more."
        />
      </Head>

      <Nav />
      <GrantProgramViewTransitions />

      <GrantProgramHero
        slug="rapid-grants"
        title="Rapid Grants"
        description="Research project, event, community chapter? We fund ambitious people doing concrete work to make AI go well."
        status="Active"
        primaryCta={{ text: 'Apply now', url: RAPID_GRANT_APPLICATION_URL }}
        secondaryCta={{ text: 'See funded projects', url: '#grants-made', onClick: scrollToGrantees }}
        facts={[
          { label: 'Typical grants', value: 'Up to $10k' },
          { label: 'Decision time', value: 'Around 5 working days' },
          { label: 'Grants made', value: grantsMadeLabel },
          { label: 'Funding given out', value: fundingGivenOutLabel },
        ]}
      />

      <Breadcrumbs route={CURRENT_ROUTE} className="bg-white" />

      <GrantPageSection
        title="What this program is for"
        contentClassName="flex flex-col gap-4"
      >
        <div className="max-w-[760px] flex flex-col gap-5">
          <P>Over the past few months, we have given out nearly $50,000 in small grants to people in the BlueDot community. Now we are going bigger.</P>
          <P>Rapid Grants fund whatever it takes to remove the barrier between talented people, great ideas and their best work on AI safety. We fund everything from compute for projects, events you want to run, travel to hubs, community building, and more.</P>
          <P>
            If you are unsure whether to apply, the default is simple:{' '}
            <a
              href={RAPID_GRANT_APPLICATION_URL}
              className="font-medium text-bluedot-navy underline underline-offset-4"
            >
              apply
            </a>
            .
          </P>
        </div>

        <div className="pt-4 min-[680px]:pt-6 min-[960px]:pt-8 grid gap-4 min-[960px]:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-[24px] border border-bluedot-navy/10 bg-white px-6 py-6 lg:px-8"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${card.accentClassName}`} />
                  <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${card.eyebrowClassName}`}>
                    {card.title}
                  </p>
                </div>
                <P className="max-w-[46ch] text-[15px] min-[680px]:text-[16px] leading-[1.8] text-bluedot-navy/70">
                  {card.body}
                </P>
              </div>
            </div>
          ))}
        </div>
      </GrantPageSection>

      <GrantPageSection
        title="How it works"
        contentClassName="flex flex-col gap-4"
      >
        <div className="relative">
          <div className="relative z-10 grid gap-4 min-[960px]:grid-cols-3">
            {PROCESS_STEPS.map((step, index) => (
              step.url ? (
                <a
                  key={step.title}
                  href={step.url}
                  className={`${index === 0
                    ? 'grant-process-card relative overflow-hidden rounded-[8px] border border-[#CFE0F6] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,254,1)_100%)] px-5 py-5 min-h-[188px]'
                    : 'grant-process-card relative overflow-hidden rounded-[8px] border border-bluedot-navy/10 bg-white px-5 py-5 min-h-[188px]'
                  } block cursor-pointer`}
                >
                  <div className="flex h-full flex-col gap-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-bluedot-navy/38">
                      {step.number}
                    </p>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-[20px] min-[680px]:text-[22px] font-medium tracking-[-0.04em] text-bluedot-navy">
                        {step.title}
                      </h3>
                      <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-navy/68">
                        {step.body}
                      </P>
                    </div>
                  </div>
                </a>
              ) : (
                <div
                  key={step.title}
                  className="grant-process-card relative overflow-hidden rounded-[8px] border border-bluedot-navy/10 bg-white px-5 py-5 min-h-[188px]"
                >
                  <div className="flex h-full flex-col gap-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-bluedot-navy/38">
                      {step.number}
                    </p>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-[20px] min-[680px]:text-[22px] font-medium tracking-[-0.04em] text-bluedot-navy">
                        {step.title}
                      </h3>
                      <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-navy/68">
                        {step.body}
                      </P>
                    </div>
                  </div>
                </div>
              )
            ))}

            <div className="grant-process-card relative overflow-hidden rounded-[8px] border border-[#D8E4F3] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,254,1)_100%)] px-5 py-5 min-h-[188px]">
              <div className="flex h-full flex-col gap-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2A5FA8]">
                  {COMMUNITY_CARD.eyebrow}
                </p>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[20px] min-[680px]:text-[22px] font-medium tracking-[-0.04em] text-bluedot-navy">
                    {COMMUNITY_CARD.title}
                  </h3>
                  <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-navy/68">
                    {COMMUNITY_CARD.body}
                  </P>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GrantPageSection>

      <div id="grants-made">
        <GrantPageSection title="Projects we have funded">
          <GranteesListSection previewRows={2} />
        </GrantPageSection>
      </div>

      <div className="border-t-hairline border-color-divider" />

      <FAQSection
        id="rapid-grants-faq"
        title="Frequently asked questions"
        items={FAQ_ITEMS}
      />

      <LandingBanner
        title="Have something real you want to get done?"
        ctaText="Apply now"
        ctaUrl={RAPID_GRANT_APPLICATION_URL}
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="Rapid Grants banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default RapidGrantsPage;
