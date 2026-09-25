import { Breadcrumbs, CTALinkOrButton } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import StatsStrip from '../../components/StatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import { useApplicationUrl } from '../../lib/hooks/useApplicationUrl';
import WhatThisIsForSection from '../../components/rapid-grants/WhatThisIsForSection';
import HowItWorksSection from '../../components/rapid-grants/HowItWorksSection';
import FundedProjectsSection from '../../components/rapid-grants/FundedProjectsSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';
import { type GrantTypeSlug } from '../../lib/grantTypes';

const GRANT_TYPE: GrantTypeSlug = 'rapid';
const FALLBACK_NAME = 'Rapid Grants';
// This page's introduction is maintained here rather than using the shared program summary.
const PAGE_DESCRIPTION = 'Funding of up to $20,000 for time and resources to make progress on AI safety or biosecurity - from exploring a promising direction to carrying out a concrete project.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const PAGE_PATH = '/grants/rapid';

const formatDecisionTime = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined) return '—';
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? '1 day' : `${days} days`;
};

const RapidGrantsPage = ({ programName }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();
  const applicationUrl = useApplicationUrl(GRANT_TYPE);

  return (
    <div className="bg-white text-bluedot-navy">
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={`${SITE_URL}${PAGE_PATH}`} />
      </Head>
      <MarketingHero title={programName} subtitle={PAGE_DESCRIPTION} />
      <Breadcrumbs route={{ title: programName, url: PAGE_PATH, parentPages: [ROUTES.home, ROUTES.grants] }} />
      <StatsStrip
        slug={GRANT_TYPE}
        compact
        stats={[
          { label: 'Grant funding', value: 'Up to $20k' },
          { label: 'Avg decision time', value: formatDecisionTime(stats?.averageHoursToDecision) },
          { label: 'Grants made', value: stats ? String(stats.count) : '—' },
          { label: 'Funding given', value: stats ? formatAmountUsd(stats.totalAmountUsd) : '—' },
        ]}
      />
      <WhatThisIsForSection />
      <HowItWorksSection />
      <FundedProjectsSection />
      <GrantFaqSection grantType={GRANT_TYPE} variant="plain" />
      {applicationUrl && (
        <div className="section-base">
          <div className="flex flex-col items-start gap-5 border-t border-bluedot-navy/15 py-10 bd-md:flex-row bd-md:items-center bd-md:justify-between bd-md:py-12">
            <p className="text-size-lg tracking-tight">Have something in mind?</p>
            <CTALinkOrButton url={applicationUrl} target="_blank" withChevron>Apply for a Rapid Grant</CTALinkOrButton>
          </div>
        </div>
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  GRANT_TYPE,
  { programName: FALLBACK_NAME, programDescription: PAGE_DESCRIPTION },
);

RapidGrantsPage.pageRendersOwnNav = true;

export default RapidGrantsPage;
