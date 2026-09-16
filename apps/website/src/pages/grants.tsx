import {
  A, Breadcrumbs, CTALinkOrButton, H3, P,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import GrantEligibilityNotice from '../components/grants/GrantEligibilityNotice';
import { PageListGroup, PageListRow } from '../components/PageListRow';
import FAQSection from '../components/lander/components/FAQSection';
import { GRANT_PATHS } from '../lib/grantRoutes';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

const TITLE = 'Grants for AI safety and biosecurity | BlueDot Impact';
const DESCRIPTION = 'Funding for people moving into AI safety and biosecurity, and for the projects they want to make happen. Find the right BlueDot grant for your next step.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

const FUNDING_ROUTES = [
  {
    slug: 'rapid-grants',
    name: 'Rapid Grants',
    amount: 'Up to $20k',
    duration: 'Flexible scope and duration',
    description: 'Time and resources for a promising next step in AI safety or biosecurity.',
    detail: 'Explore an idea, do research or build something. Funding can cover living costs, compute, travel and more.',
    application: 'About 15 minutes to apply',
    cta: 'Explore Rapid Grants',
  },
  {
    slug: 'career-transition-grant',
    name: 'Career Transition Grants',
    amount: 'Up to $200k',
    duration: 'Typically around six months',
    description: 'Runway to move full-time into impactful AI safety or biosecurity work.',
    detail: 'Build experience, produce useful work or test a new career path. CTGs generally start at $20k; smaller requests go to Rapid.',
    application: 'About 45 minutes to apply',
    cta: 'Explore Career Transition Grants',
  },
] as const;

const FAQ_ITEMS = [
  {
    id: 'choosing-a-grant',
    question: 'What if I am unsure which grant fits?',
    answer: 'For requests under $20k, choose Rapid Grants. For a sustained, full-time career transition, choose a CTG. If you are still unsure, apply to the closest fit and we can redirect you.',
  },
  {
    id: 'career-plan',
    question: 'Do I need a fixed career plan?',
    answer: 'No. We look for a promising direction, a way to test it, and useful work or learning along the way.',
  },
  {
    id: 'other-funding',
    question: 'What about a larger project or funding for an organisation?',
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
        cta={<CTALinkOrButton url="#find-your-grant" withChevron>Find the right grant</CTALinkOrButton>}
      />

      <Breadcrumbs route={ROUTES.grants} />

      <section id="find-your-grant" aria-label="Find your grant" className="section section-body pt-10 scroll-mt-28">
        <PageListGroup>
          {FUNDING_ROUTES.map((route) => {
            const stats = route.slug === 'rapid-grants' ? rapidStats : careerTransitionStats;

            return (
              <PageListRow
                key={route.slug}
                href={GRANT_PATHS[route.slug]}
                title={route.name}
                summary={`${route.description} ${route.detail}`}
                meta={(
                  <>
                    <span>{route.amount}</span> · {route.duration} · {route.application}
                    {stats && (
                      <span className="block">
                        {formatAmountUsd(stats.totalAmountUsd)} awarded across {stats.count} {stats.count === 1 ? 'grant' : 'grants'}.
                      </span>
                    )}
                  </>
                )}
                ctaLabel={route.cta}
              />
            );
          })}
        </PageListGroup>
        <P className="mt-6 text-size-sm text-secondary">
          You do not need to have taken a BlueDot course to apply.
        </P>
        <div className="mt-8">
          <GrantEligibilityNotice />
        </div>
      </section>

      <section aria-labelledby="what-we-look-for-heading" className="section section-body">
        <H3><span id="what-we-look-for-heading">What we look for</span></H3>
        <P className="mt-4 max-w-[780px] text-size-sm text-secondary">
          A clear connection to reducing catastrophic risk, evidence you can make progress, and a useful role for funding.
          Tell us what you would do next and how a grant would help.
        </P>
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
