import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import FourDayProgrammeSection from '../../components/context-week/FourDayProgrammeSection';
import OverviewSection from '../../components/context-week/OverviewSection';
import ParticipantOutputsSection from '../../components/context-week/ParticipantOutputsSection';
import WhoItIsForSection from '../../components/context-week/WhoItIsForSection';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import AboutBlueDotSection from '../../components/incubator-week/AboutBlueDotSection';
import { linkPreviewMetaTags } from '../../lib/linkPreviewMetaTags';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';
import { ROUTES } from '../../lib/routes';

const PROGRAM_SLUG = 'context-week';
const FALLBACK_NAME = 'Context Week';
const PROGRAM_DESCRIPTION = 'A four-day residential programme for people making important AI-safety career or project decisions.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const LINK_PREVIEW_IMAGE = `${SITE_URL}/images/programs/link-preview/context-week.png`;
const LINK_PREVIEW_ALT = 'Context Week v1. Four-day residential programme for AI-safety career and project decisions. Lighthaven, Berkeley, August 30 to September 4, 2026. Travel, accommodation, and meals covered.';

const ContextWeekProgramPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const applicationUrl = useGrantApplicationUrl('context-week');
  const currentRoute: BluedotRoute = {
    title: programName,
    url: '/programs/context-week',
    parentPages: [ROUTES.home, ROUTES.programs],
  };

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
        <meta property="og:title" content={`${programName} | BlueDot Impact`} />
        <meta property="og:description" content={programDescription} />
        <meta property="og:url" content={`${SITE_URL}/programs/context-week`} />
        {linkPreviewMetaTags({
          imageUrl: LINK_PREVIEW_IMAGE,
          alt: LINK_PREVIEW_ALT,
          width: 1200,
          height: 630,
          imageType: 'image/png',
        })}
        <meta name="twitter:title" content={`${programName} | BlueDot Impact`} />
        <meta name="twitter:description" content={programDescription} />
      </Head>
      <MarketingHero title={programName} subtitle={programDescription} />
      <Breadcrumbs route={currentRoute} />
      <GrantStatsStrip
        program="context-week"
        compact
        primaryAction={{
          label: 'Apply to Context Week',
          url: applicationUrl,
        }}
        stats={[
          { label: 'Cohort', value: 'Around 20 people' },
          { label: 'Dates', value: 'Aug 30–Sept 4, 2026' },
          { label: 'Location', value: 'Lighthaven, Berkeley' },
          { label: 'Covered', value: 'Travel, accommodation, meals' },
        ]}
      />
      <OverviewSection />
      <WhoItIsForSection />
      <FourDayProgrammeSection />
      <ParticipantOutputsSection />
      <AboutBlueDotSection
        applicationUrl={applicationUrl}
        ctaLabel="Apply to Context Week"
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: PROGRAM_DESCRIPTION },
);

ContextWeekProgramPage.pageRendersOwnNav = true;

export default ContextWeekProgramPage;
