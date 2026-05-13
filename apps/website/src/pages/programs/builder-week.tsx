import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import FieldBuildersSection from '../../components/builder-week/FieldBuildersSection';
import TheWeekSection from '../../components/builder-week/TheWeekSection';
import WhoYouAreSection from '../../components/builder-week/WhoYouAreSection';
import WhatCouldYouBuildSection from '../../components/builder-week/WhatCouldYouBuildSection';
import AboutBlueDotSection from '../../components/incubator-week/AboutBlueDotSection';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import { ROUTES } from '../../lib/routes';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'builder-week';
const FALLBACK_NAME = 'Builder Week';
const FALLBACK_DESCRIPTION = 'There are ~2k people working full-time on AI safety. The field needs thousands more. Fly to London for 5 days to design and launch a new pathway. $5k on the spot if your pitch lands. Up to $200k for the strongest programs.';
const APPLICATION_DEADLINE = '1 June 2026';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

const BuilderWeekProgramPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const applicationUrl = useGrantApplicationUrl('builder-week');
  const currentRoute: BluedotRoute = {
    title: programName,
    url: '/programs/builder-week',
    parentPages: [ROUTES.home, ROUTES.programs],
  };

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
        <meta property="og:title" content={`${programName} | BlueDot Impact`} />
        <meta property="og:description" content={programDescription} />
        <meta property="og:url" content={`${SITE_URL}/programs/builder-week`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${programName} | BlueDot Impact`} />
        <meta name="twitter:description" content={programDescription} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={programDescription}
      />
      <Breadcrumbs route={currentRoute} />
      <GrantStatsStrip
        program="builder-week"
        compact
        primaryAction={{
          label: `Apply by ${APPLICATION_DEADLINE}`,
          url: applicationUrl,
        }}
        stats={[
          { label: 'Cohort', value: 'v1' },
          { label: 'Runs', value: '8–12 June 2026' },
          { label: 'Funding', value: 'Up to $200k' },
          { label: 'Covered', value: 'Flights, accom, meals' },
        ]}
      />
      <FieldBuildersSection />
      <TheWeekSection />
      <WhoYouAreSection />
      <WhatCouldYouBuildSection />
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

BuilderWeekProgramPage.pageRendersOwnNav = true;

export default BuilderWeekProgramPage;
