import {
  A, Breadcrumbs, H2, P,
} from '@bluedot/ui';
import Head from 'next/head';
import Link from 'next/link';
import { HiArrowUpRight } from 'react-icons/hi2';
import MarketingHero from '../components/MarketingHero';
import { FUNDING_RESTRICTIONS_FAQ } from '../components/grants/fundingRestrictions';
import FAQSection from '../components/lander/components/FAQSection';
import { GRANT_PATHS } from '../lib/grantRoutes';
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
    slug: 'rapid-grants',
    name: 'Rapid Grants',
    amount: 'Up to $20k',
    description: 'Funding for time and resources to explore an idea, do research or build something in AI safety or biosecurity.',
    application: 'About 15 minutes to apply',
  },
  {
    slug: 'career-transition-grant',
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
    answer: 'Choose the program that best matches what you want to do. If you are still unsure, apply to the closest fit and we can redirect you.',
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

      <section id="find-your-grant" aria-label="Find your grant" className="scroll-mt-28 bg-slate-50/70">
        <div className="section-base py-10 sm:py-12">
          <div className="grid gap-5 md:grid-cols-2">
            {FUNDING_ROUTES.map((route) => {
              const stats = route.slug === 'rapid-grants' ? rapidStats : careerTransitionStats;

              return (
                <Link
                  key={route.slug}
                  href={GRANT_PATHS[route.slug]}
                  aria-labelledby={`${route.slug}-heading`}
                  className="group flex flex-col rounded-2xl border border-bluedot-navy/10 bg-white p-6 transition-colors hover:border-bluedot-normal/40 hover:bg-bluedot-light/20 focus-visible:border-bluedot-normal/40 focus-visible:bg-bluedot-light/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bluedot-normal sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <H2 className="text-size-lg group-hover:text-bluedot-normal group-focus-visible:text-bluedot-normal">
                      <span id={`${route.slug}-heading`}>{route.name}</span>
                    </H2>
                    <HiArrowUpRight className="mt-1 shrink-0 text-bluedot-navy/40 group-hover:text-bluedot-normal group-focus-visible:text-bluedot-normal" size={22} aria-hidden="true" />
                  </div>
                  <P className="mt-4 max-w-prose text-bluedot-navy/80">{route.description}</P>
                  <div className="mt-auto pt-8 text-size-xs leading-relaxed text-bluedot-navy/65">
                    <p className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-medium text-bluedot-navy">{route.amount}</span>
                      <span>{route.application}</span>
                    </p>
                    {stats && (
                      <p className="mt-2">
                        {AWARDED_AMOUNT_FORMAT.format(stats.totalAmountUsd).toLowerCase()} awarded across {stats.count.toLocaleString('en-US')} {stats.count === 1 ? 'grant' : 'grants'}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <P className="mt-6 text-center text-size-xs text-bluedot-navy/65">Career Transition Grants generally start at $20k. For smaller requests, apply to Rapid Grants.</P>
        </div>
      </section>

      <FAQSection title="A few common questions" items={FAQ_ITEMS} />
    </div>
  );
};

GrantsPage.pageRendersOwnNav = true;

export default GrantsPage;
