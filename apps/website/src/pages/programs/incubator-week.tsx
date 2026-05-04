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
const FALLBACK_DESCRIPTION = 'Most accelerators take 12 weeks and 7%. We take 5 days and 0%. Fly to London to turn your AI safety idea into a funded org. $50k if your pitch lands. More for the strongest teams. Equity-free.';
const APPLICATION_DEADLINE = '26 May';

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
          { label: 'Cohort', value: 'v4' },
          { label: 'Runs', value: '1–5 June' },
          { label: 'Funding', value: '$50k equity-free' },
          { label: 'Covered', value: 'Flights, stay, meals' },
        ]}
      />
      <TrackRecordSection />
      <TheWeekSection />
      <AboutYouSection />
      <AboutBlueDotSection
        applicationUrl={applicationUrl}
        applicationDeadline={APPLICATION_DEADLINE}
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: FALLBACK_DESCRIPTION },
);

IncubatorWeekProgramPage.pageRendersOwnNav = true;

export default IncubatorWeekProgramPage;
