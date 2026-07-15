import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import TrackRecordSection from '../../components/incubator-week/TrackRecordSection';
import TheWeekSection from '../../components/incubator-week/TheWeekSection';
import AboutYouSection from '../../components/incubator-week/AboutYouSection';
import AboutBlueDotSection from '../../components/incubator-week/AboutBlueDotSection';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import { ROUTES } from '../../lib/routes';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'incubator-week';
const FALLBACK_NAME = 'Incubator Week';
const PROGRAM_DESCRIPTION = '5 days. All expenses paid. $100k in funding if we back your pitch.';
const APPLICATION_DEADLINE = 'August 7';
const CONTACT_EMAIL = 'joshua@bluedot.org';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const LINK_PREVIEW_IMAGE = `${SITE_URL}/images/programs/link-preview/incubator-week.png`;

const IncubatorWeekProgramPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const applicationUrl = useGrantApplicationUrl('incubator-week');
  const currentRoute: BluedotRoute = {
    title: programName,
    url: '/programs/incubator-week',
    parentPages: [ROUTES.home, ROUTES.programs],
  };

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
        <meta property="og:title" content={`${programName} | BlueDot Impact`} />
        <meta property="og:description" content={programDescription} />
        <meta property="og:url" content={`${SITE_URL}/programs/incubator-week`} />
        <meta property="og:image" content={LINK_PREVIEW_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Incubator Week v5. 5 days. All expenses paid. $100k in funding. San Francisco, August 17–21. Apply by August 7. BlueDot Impact." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${programName} | BlueDot Impact`} />
        <meta name="twitter:description" content={programDescription} />
        <meta name="twitter:image" content={LINK_PREVIEW_IMAGE} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={programDescription}
      />
      <Breadcrumbs route={currentRoute} />
      <GrantStatsStrip
        program="incubator-week"
        compact
        primaryAction={{
          label: `Apply by ${APPLICATION_DEADLINE}`,
          url: applicationUrl,
        }}
        stats={[
          { label: 'Cohort', value: 'v5' },
          { label: 'Runs', value: 'August 17–21' },
          { label: 'Funding', value: 'Up to $100k in grants' },
          { label: 'Covered', value: 'All expenses paid' },
        ]}
      />
      <TrackRecordSection />
      <TheWeekSection />
      <AboutYouSection />
      <AboutBlueDotSection
        applicationUrl={applicationUrl}
        applicationDeadline={APPLICATION_DEADLINE}
        contactEmail={CONTACT_EMAIL}
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: PROGRAM_DESCRIPTION },
);

IncubatorWeekProgramPage.pageRendersOwnNav = true;

export default IncubatorWeekProgramPage;
