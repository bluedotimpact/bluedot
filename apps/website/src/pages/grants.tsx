import {
  A, Breadcrumbs, CTALinkOrButton, H2, P,
} from '@bluedot/ui';
import Head from 'next/head';
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
    cta: 'Explore Rapid Grants',
  },
  {
    slug: 'career-transition-grant',
    name: 'Career Transition Grants',
    amount: 'Up to $200k',
    description: 'Funding to move full-time into AI safety or biosecurity. Build experience, produce useful work or test a career path.',
    application: 'About 45 minutes to apply',
    cta: 'Explore Career Transition Grants',
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

      <section id="find-your-grant" aria-label="Find your grant" className="section section-body pt-10 scroll-mt-28">
        <div className="divide-y divide-bluedot-navy/10">
          {FUNDING_ROUTES.map((route) => {
            const stats = route.slug === 'rapid-grants' ? rapidStats : careerTransitionStats;

            return (
              <article key={route.slug} aria-labelledby={`${route.slug}-heading`} className="py-8 first:pt-0 last:pb-0">
                <H2 className="text-size-lg"><span id={`${route.slug}-heading`}>{route.name}</span></H2>
                <P className="mt-3 text-size-md font-medium">{route.amount}</P>
                <P className="mt-5 text-size-md">{route.description}</P>
                <div className="pt-6">
                  <P className="text-size-sm text-secondary">{route.application}</P>
                  <A href={GRANT_PATHS[route.slug]} className="mt-3 inline-flex items-center gap-2 font-medium no-underline hover:underline">
                    {route.cta}<span aria-hidden="true">→</span>
                  </A>
                  {stats && (
                    <P className="mt-4 text-size-xs text-secondary">
                      {AWARDED_AMOUNT_FORMAT.format(stats.totalAmountUsd).toLowerCase()} awarded · {stats.count.toLocaleString('en-US')} {stats.count === 1 ? 'grant' : 'grants'}
                    </P>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <P className="mt-10 text-size-sm text-secondary">CTGs generally start at $20k. For smaller requests, apply to Rapid Grants.</P>
      </section>

      <FAQSection title="A few common questions" items={FAQ_ITEMS} />

      <div className="section-base flex justify-center pb-10">
        <CTALinkOrButton
          url={ROUTES.programs.url}
          className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-size-sm font-medium tracking-tighter rounded-md hover:bg-bluedot-navy/15"
        >
          Explore in-person programs
        </CTALinkOrButton>
      </div>
    </div>
  );
};

GrantsPage.pageRendersOwnNav = true;

export default GrantsPage;
