import {
  Breadcrumbs, CTALinkOrButton, ErrorSection, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import PageNewsletter from '../components/PageNewsletter';
import { PageListGroup, PageListRow } from '../components/PageListRow';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

const ProgramsPage = () => {
  const { data: programs, isLoading, error } = trpc.programs.getAll.useQuery();
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: ctStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  // Per-slug stats overlay. Keeps the live "$50k+ across N grants" copy fresh
  // without baking stale numbers into Airtable.
  const getMeta = (slug: string | null): string | null => {
    if (slug === 'rapid-grants' && rapidStats) {
      return `${formatAmountUsd(rapidStats.totalAmountUsd)} deployed so far across ${pluralizeGrants(rapidStats.count)}.`;
    }

    if (slug === 'career-transition-grant' && ctStats) {
      return `${formatAmountUsd(ctStats.totalAmountUsd)} awarded so far across ${pluralizeGrants(ctStats.count)}.`;
    }

    return null;
  };

  return (
    <div>
      <Head>
        <title>Programs | BlueDot Impact</title>
        <meta
          name="description"
          content="Explore BlueDot Impact programs, including Rapid Grants, Incubator Week, and 1-1 advising."
        />
      </Head>

      <MarketingHero
        title="Programs"
        subtitle="Go beyond a course. Build, launch, get funded."
      />

      <Breadcrumbs route={ROUTES.programs} />

      <section className="section section-body">
        <div className="flex flex-col gap-12 lg:gap-14">
          {error && <ErrorSection error={error} />}
          {isLoading && <ProgressDots />}
          {!isLoading && !error && programs && (
            <PageListGroup>
              {programs.map((program) => (
                <PageListRow
                  key={program.id}
                  href={program.slug ? `/programs/${program.slug}` : (program.applicationForm ?? '#')}
                  title={program.name}
                  summary={program.description}
                  meta={getMeta(program.slug)}
                  ctaLabel="Explore program"
                />
              ))}
            </PageListGroup>
          )}
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
