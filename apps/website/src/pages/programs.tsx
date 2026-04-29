import { Breadcrumbs, CTALinkOrButton } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import PageNewsletter from '../components/PageNewsletter';
import { PageListGroup, PageListRow } from '../components/PageListRow';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

type ProgramItem = {
  id: string;
  name: string;
  href: string;
  summary: string;
  detail: string;
  ctaLabel: string;
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
      href: '/programs/rapid-grants',
      summary: 'Small, fast funding for concrete AI safety work.',
      detail: `Five-minute application, decisions in days, money upfront by default. ${rapidFundingLabel} deployed so far across ${rapidGrantsLabel}.`,
      ctaLabel: 'Explore program',
    },
    {
      id: 'career-transition-grant',
      name: 'Career Transition Grants',
      href: '/programs/career-transition-grant',
      summary: 'Funding to enable you to work full-time on impactful AI safety work.',
      detail: `Propose your plan for contributing full-time to AI safety. ${ctFundingLabel} awarded so far across ${ctGrantsLabel}.`,
      ctaLabel: 'Explore program',
    },
    {
      id: 'technical-ai-safety-project-sprint',
      name: 'Technical AI Safety Project Sprint',
      href: '/courses/technical-ai-safety-project',
      summary: 'A structured sprint for people who need momentum and accountability to ship.',
      detail: '30 hours, expert check-ins, peer accountability, and a public output.',
      ctaLabel: 'Explore program',
    },
    {
      id: 'advising',
      name: '1-1 advising',
      href: '/programs/advising',
      summary: 'A 30-min call with the BlueDot team to accelerate you towards impactful work in AI safety.',
      detail: '200+ advising calls done. Decisions in ~5 working days.',
      ctaLabel: 'Explore program',
    },
    {
      id: 'incubator-week',
      name: 'Incubator Week',
      href: '/programs/incubator-week',
      summary: 'A concentrated week for stronger founders and operators testing bigger bets.',
      detail: 'Five-day London intensive. All expenses paid. Strong teams pitch for funding on Friday.',
      ctaLabel: 'Learn more',
    },
  ];

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
    <div>
      <Head>
        <title>Programs | BlueDot Impact</title>
        <meta
          name="description"
          content="Explore BlueDot Impact programs, including Rapid Grants, Incubator Week, and the Technical AI Safety Project Sprint."
        />
      </Head>

      <MarketingHero
        title="Programs"
        subtitle="Go beyond a course. Build, launch, get funded."
      />

      <Breadcrumbs route={ROUTES.programs} />

      <section className="section section-body">
        <div className="flex flex-col gap-12 lg:gap-14">
          <PageListGroup>
            {programs.map(renderRow)}
          </PageListGroup>
        </div>

        <div className="flex justify-center pt-6 bd-md:pt-8 lg:pt-10">
          <CTALinkOrButton
            url={ROUTES.courses.url}
            className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-size-sm font-[450] tracking-[-0.3px] rounded-md hover:bg-bluedot-navy/15"
          >
            Explore courses instead
          </CTALinkOrButton>
        </div>
      </section>

      <PageNewsletter />
    </div>
  );
};

ProgramsPage.pageRendersOwnNav = true;

export default ProgramsPage;
