import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  ErrorSection,
  ProgressDots,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import { GetJobsResponse } from '../api/cms/jobs';
import CultureSection from '../../components/join-us/CultureSection';
import ValuesSection from '../../components/join-us/ValuesSection';
import JobsListSection from '../../components/join-us/JobsListSection';

const CURRENT_ROUTE = ROUTES.joinUs;

const JoinUsPage = () => {
  const [{ data: cmsData, loading: cmsLoading, error: cmsError }] = useAxios<GetJobsResponse>({
    method: 'get',
    url: '/api/cms/jobs',
  });

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Join Us</HeroMiniTitle>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="#open-roles-anchor" withChevron>See open roles</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      {cmsLoading && <Section title="Careers at BlueDot Impact"><ProgressDots /></Section>}
      {cmsError && <ErrorSection error={cmsError} />}
      {cmsData && <JobsListSection cmsJobs={cmsData.jobs} />}
      <CultureSection />
      <ValuesSection />
    </div>
  );
};

export default JoinUsPage;
