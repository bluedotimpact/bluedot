import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/career-transition-grant/WhatThisIsForSection';
import ExpectationsSection from '../../components/career-transition-grant/ExpectationsSection';
import NextStepsSection from '../../components/career-transition-grant/NextStepsSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'career-transition-grant';
const FALLBACK_NAME = 'Career Transition Grants';
const FALLBACK_DESCRIPTION = 'Funding and support to help you work full-time on AI safety.';

const CareerTransitionGrantPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getCareerTransitionGrantStats.useQuery();
  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingAwardedLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

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
      <Breadcrumbs
        route={{
          title: programName,
          url: '/programs/career-transition-grant',
          parentPages: [ROUTES.home, ROUTES.programs],
        }}
      />
      <GrantStatsStrip
        program="career-transition-grant"
        stats={[
          { label: 'Grants made', value: grantsMadeLabel },
          { label: 'Funding awarded', value: fundingAwardedLabel },
        ]}
      />
      <WhatThisIsForSection />
      <ExpectationsSection />
      <NextStepsSection />
      <GrantFaqSection program="career-transition-grant" />
      <GrantCta program="career-transition-grant" />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: FALLBACK_DESCRIPTION },
);

CareerTransitionGrantPage.pageRendersOwnNav = true;

export default CareerTransitionGrantPage;
