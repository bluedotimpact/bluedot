import {
  A, Breadcrumbs, P,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import OpportunityCard from '../components/OpportunityCard';
import { FUNDING_RESTRICTIONS_FAQ } from '../components/grants/fundingRestrictions';
import FAQSection from '../components/lander/components/FAQSection';
import { grantTypePath } from '../lib/grantTypes';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const TITLE = 'Grants for AI safety and biosecurity | BlueDot Impact';
const DESCRIPTION = 'Funding for people moving into AI safety and biosecurity, and for the projects they want to make happen. Find the right BlueDot grant for your next step.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const AWARDED_AMOUNT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const FUNDING_ROUTES = [
  {
    slug: 'rapid',
    name: 'Rapid Grants',
    amount: 'Up to $20k',
    description: 'Funding for time and resources to explore an idea, do research or build something in AI safety or biosecurity.',
    application: 'About 15 minutes to apply',
  },
  {
    slug: 'career-transition',
    name: 'Career Transition Grants',
    amount: 'Up to $200k',
    description: 'Funding to move full-time into AI safety or biosecurity. Build experience, produce useful work or test a career path.',
    application: 'About 45 minutes to apply',
  },
] as const;

const FAQ_ITEMS = [
  {
    id: 'choosing-a-grant',
    question: 'What if I am unsure which grant fits?',
    answer: 'Choose the grant that best matches what you want to do. If you are still unsure, apply to the closest fit and we can redirect you.',
  },
  {
    id: 'bluedot-course',
    question: 'Do I need to have taken a BlueDot course?',
    answer: 'No. You do not need to have taken a BlueDot course to apply for either grant.',
  },
  FUNDING_RESTRICTIONS_FAQ,
  {
    id: 'career-plan',
    question: 'Do I need a fixed career plan?',
    answer: 'No. We look for a promising direction, a way to test it, and useful work or learning along the way.',
  },
  {
    id: 'other-funding',
    question: 'What about a larger project or funding for an organization?',
    answer: (
      <>
        <A href={ROUTES.contact.url}>Contact us</A> with your plan, the amount you need and what funding would enable.
        CTGs fund personal transitions; other requests may need a different route.
      </>
    ),
    answerText: 'Contact us with your plan, the amount you need and what funding would enable. CTGs fund personal transitions; other requests may need a different route.',
  },
];

const GrantsPage = () => {
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: careerTransitionStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  return (
    <div>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={`${SITE_URL}/grants`} />
        <meta key="og:title" property="og:title" content={TITLE} />
        <meta key="og:description" property="og:description" content={DESCRIPTION} />
        <meta key="twitter:title" name="twitter:title" content={TITLE} />
        <meta key="twitter:description" name="twitter:description" content={DESCRIPTION} />
      </Head>

      <MarketingHero
        title="Grants"
        subtitle="Funding to explore, build and move full-time into work that reduces catastrophic risks from AI and biological threats."
      />

      <Breadcrumbs route={ROUTES.grants} />

      <section id="find-your-grant" aria-label="Find your grant" className="scroll-mt-28 bg-canvas">
        <div className="section-base py-10 sm:py-12">
          <ul className="grid list-none gap-5 bd-md:grid-cols-2 lg:gap-6">
            {FUNDING_ROUTES.map((route) => {
              const stats = route.slug === 'rapid' ? rapidStats : careerTransitionStats;

              return (
                <li key={route.slug} className="min-w-0">
                  <OpportunityCard
                    href={grantTypePath(route.slug)}
                    title={route.name}
                    description={route.description}
                    tone={route.slug === 'rapid' ? 'funding' : 'careerTransition'}
                    ctaLabel="Explore grant"
                    details={(
                      <div>
                        <P className="text-size-lg font-medium text-white">{route.amount}</P>
                        <P className="mt-1 text-size-xs text-white/85">{route.application}</P>
                        {stats && (
                          <P className="mt-3 text-size-xs text-white/75">
                            {AWARDED_AMOUNT_FORMAT.format(stats.totalAmountUsd).toLowerCase()} awarded across {stats.count.toLocaleString('en-US')} {stats.count === 1 ? 'grant' : 'grants'}
                          </P>
                        )}
                      </div>
                    )}
                  />
                </li>
              );
            })}
          </ul>
          <P className="mt-6 text-center text-size-xs text-bluedot-navy/65">Career Transition Grants generally start at $20k. For smaller requests, apply to Rapid Grants.</P>
        </div>
      </section>

      <FAQSection title="Frequently asked questions" items={FAQ_ITEMS} />
    </div>
  );
};

GrantsPage.pageRendersOwnNav = true;

export default GrantsPage;
