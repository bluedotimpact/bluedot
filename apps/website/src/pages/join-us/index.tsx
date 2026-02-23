import {
  Breadcrumbs,
  ErrorSection,
  H1,
  ProgressDots,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { Nav } from '../../components/Nav/Nav';
import JobsListSection from '../../components/join-us/JobsListSection';
import WhyUsSection from '../../components/join-us/WhyUsSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.joinUs;

const JoinUsHero = () => {
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
              Work with us
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              AI safety needs thousands more people. We need the team that gets them there.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const JoinUsPage = () => {
  const { data: cmsData, isLoading: cmsLoading, error: cmsError } = trpc.jobs.getAll.useQuery();

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="AI safety needs thousands more people. We need the team that gets them there."
        />
      </Head>
      <JoinUsHero />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <WhyUsSection />
      {cmsLoading && (
        <Section title="Open roles">
          <ProgressDots />
        </Section>
      )}
      {cmsError && <ErrorSection error={cmsError} />}
      {cmsData && <JobsListSection jobs={cmsData} />}
    </div>
  );
};

export default JoinUsPage;
