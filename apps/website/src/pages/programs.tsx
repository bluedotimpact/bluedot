import {
  Breadcrumbs,
  CTALinkOrButton,
  H1,
} from '@bluedot/ui';
import Head from 'next/head';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { Nav } from '../components/Nav/Nav';
import { PageListGroup, PageListRow } from '../components/PageListRow';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

type ProgramItem = {
  id: string;
  name: string;
  status: 'Active' | 'On hiatus';
  href: string;
  summary: string;
  detail: string;
  ctaLabel: string;
};

const ProgramsHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />

      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] min-[680px]:min-h-[366px] pb-12 pt-20 min-[680px]:pb-16 min-[680px]:pt-20">
        <div className="w-full mx-auto max-w-max-width px-spacing-x">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              Programs
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Go beyond a course. Build, launch, get funded.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProgramsPage = () => {
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: ctStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

  // Fallback strings render while each query is loading (stats === undefined).
  // Once stats resolves, show real values even if count/amount are 0.
  const rapidFundingLabel = rapidStats ? formatAmountUsd(rapidStats.totalAmountUsd) : '$50k+';
  const rapidGrantsLabel = rapidStats ? pluralizeGrants(rapidStats.count) : 'many grants';
  const ctFundingLabel = ctStats ? formatAmountUsd(ctStats.totalAmountUsd) : '$50k+';
  const ctGrantsLabel = ctStats ? pluralizeGrants(ctStats.count) : 'a handful of grants';

  const programs: ProgramItem[] = [
    {
      id: 'rapid-grants',
      name: 'Rapid Grants',
      status: 'Active',
      href: '/programs/rapid-grants',
      summary: 'Small, fast funding for concrete AI safety work.',
      detail: `Five-minute application, decisions in days, money upfront by default. ${rapidFundingLabel} deployed so far across ${rapidGrantsLabel}.`,
      ctaLabel: 'Explore program',
    },
    {
      id: 'career-transition-grant',
      name: 'Career Transition Grants',
      status: 'Active',
      href: '/programs/career-transition-grant',
      summary: 'Funding to enable you to work full-time on impactful AI safety work.',
      detail: `Propose your plan for contributing full-time to AI safety. ${ctFundingLabel} awarded so far across ${ctGrantsLabel}.`,
      ctaLabel: 'Explore program',
    },
    {
      id: 'technical-ai-safety-project-sprint',
      name: 'Technical AI Safety Project Sprint',
      status: 'Active',
      href: '/courses/technical-ai-safety-project',
      summary: 'A structured sprint for people who need momentum and accountability to ship.',
      detail: '30 hours, expert check-ins, peer accountability, and a public output.',
      ctaLabel: 'Explore program',
    },
    {
      id: 'incubator-week',
      name: 'Incubator Week',
      status: 'On hiatus',
      href: '/courses/incubator-week',
      summary: 'A concentrated week for stronger founders and operators testing bigger bets.',
      detail: 'Five-day London intensive. All expenses paid. Strong teams pitch for funding on Friday.',
      ctaLabel: 'Learn more',
    },
  ];

  const activePrograms = programs.filter((program) => program.status === 'Active');
  const pausedPrograms = programs.filter((program) => program.status === 'On hiatus');

  const renderRow = (program: ProgramItem) => (
    <PageListRow
      key={program.id}
      href={program.href}
      title={program.name}
      summary={program.summary}
      meta={program.detail}
      ctaLabel={program.ctaLabel}
    />
  );

  return (
    <div className="bg-white">
      <Head>
        <title>Programs | BlueDot Impact</title>
        <meta
          name="description"
          content="Explore BlueDot Impact programs, including Rapid Grants, Incubator Week, and the Technical AI Safety Project Sprint."
        />
      </Head>

      <ProgramsHero />
      <Breadcrumbs route={ROUTES.programs} />

      <section className="section section-body bg-white">
        <div className="flex flex-col gap-12 min-[1024px]:gap-14">
          <PageListGroup label="Active">
            {activePrograms.map(renderRow)}
          </PageListGroup>
          <PageListGroup label="On hiatus">
            {pausedPrograms.map(renderRow)}
          </PageListGroup>
        </div>

        <div className="flex justify-center pt-6 min-[680px]:pt-8 min-[1024px]:pt-10">
          <CTALinkOrButton
            url={ROUTES.courses.url}
            className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-[15px] font-[450] tracking-[-0.3px] rounded-md hover:bg-bluedot-navy/15"
          >
            Explore courses instead
          </CTALinkOrButton>
        </div>
      </section>

      <div className="w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y pb-16">
        <NewsletterBanner />
      </div>
    </div>
  );
};

export default ProgramsPage;
