import {
  Breadcrumbs,
  CTALinkOrButton,
  ErrorSection,
  HeroCTAContainer,
  HeroH1,
  HeroSection,
  ProgressDots,
  Section,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import CultureSection from '../../components/join-us/CultureSection';
import JobsListSection from '../../components/join-us/JobsListSection';
import ValuesSection from '../../components/join-us/ValuesSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.joinUs;

const JoinUsPage = () => {
  const { data: cmsData, isLoading: cmsLoading, error: cmsError } = trpc.jobs.getAll.useQuery();

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI."
        />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Join Us</HeroMiniTitle>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="#open-roles-anchor" withChevron>
            See open roles
          </CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      {cmsLoading && (
        <Section title="Careers at BlueDot Impact">
          <ProgressDots />
        </Section>
      )}
      {cmsError && <ErrorSection error={cmsError} />}
      {cmsData && <JobsListSection jobs={cmsData} />}
      <CultureSection />
      <ValuesSection />
    </div>
  );
};

export default JoinUsPage;
