import {
  Breadcrumbs,
  ErrorSection,
  H3,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import PageNewsletter from '../../components/PageNewsletter';
import JobsListSection from '../../components/join-us/JobsListSection';
import WhyUsSection from '../../components/join-us/WhyUsSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.joinUs;
const JOIN_US_SUBTITLE = 'AI safety needs thousands more people. We need the team that gets them there.';

const JoinUsPage = () => {
  const { data: cmsData, isLoading: cmsLoading, error: cmsError } = trpc.jobs.getAll.useQuery();

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content={JOIN_US_SUBTITLE} />
      </Head>
      <MarketingHero title="Work with us" subtitle={JOIN_US_SUBTITLE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <WhyUsSection />
      {cmsLoading && (
        <section className="section section-body">
          <H3 className="mb-6">
            Open roles
          </H3>
          <ProgressDots />
        </section>
      )}
      {cmsError && <ErrorSection error={cmsError} />}
      {cmsData && <JobsListSection jobs={cmsData} />}
      <PageNewsletter />
    </div>
  );
};

JoinUsPage.pageRendersOwnNav = true;

export default JoinUsPage;
