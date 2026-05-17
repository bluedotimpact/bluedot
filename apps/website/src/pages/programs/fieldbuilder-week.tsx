import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import FieldBuildersSection from '../../components/fieldbuilder-week/FieldBuildersSection';
import TheWeekSection from '../../components/fieldbuilder-week/TheWeekSection';
import WhoYouAreSection from '../../components/fieldbuilder-week/WhoYouAreSection';
import WhatCouldYouBuildSection from '../../components/fieldbuilder-week/WhatCouldYouBuildSection';
import AboutBlueDotSection from '../../components/incubator-week/AboutBlueDotSection';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import { ROUTES } from '../../lib/routes';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'fieldbuilder-week';
const FALLBACK_NAME = 'Fieldbuilder Week';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const LINK_PREVIEW_IMAGE = `${SITE_URL}/images/programs/link-preview/fieldbuilder-week.png`;

const FieldbuilderWeekProgramPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const applicationUrl = useGrantApplicationUrl('fieldbuilder-week');
  const currentRoute: BluedotRoute = {
    title: programName,
    url: '/programs/fieldbuilder-week',
    parentPages: [ROUTES.home, ROUTES.programs],
  };

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
        <meta property="og:title" content={`${programName} | BlueDot Impact`} />
        <meta property="og:description" content={programDescription} />
        <meta property="og:url" content={`${SITE_URL}/programs/fieldbuilder-week`} />
        <meta property="og:image" content={LINK_PREVIEW_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={programDescription} />
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
        program="fieldbuilder-week"
        compact
        primaryAction={{
          label: 'Register interest',
          url: applicationUrl,
        }}
        stats={[
          { label: 'Cohort', value: 'v1' },
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
        ctaLabel="Register interest"
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: '' },
);

FieldbuilderWeekProgramPage.pageRendersOwnNav = true;

export default FieldbuilderWeekProgramPage;
