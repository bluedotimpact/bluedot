import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/career-transition-grant/WhatThisIsForSection';
import WhatWeLookForSection from '../../components/career-transition-grant/WhatWeLookForSection';
import WhatYouReceiveSection from '../../components/career-transition-grant/WhatYouReceiveSection';
import ExpectationsSection from '../../components/career-transition-grant/ExpectationsSection';
import ApplicationPreviewSection from '../../components/career-transition-grant/ApplicationPreviewSection';
import NextStepsSection from '../../components/career-transition-grant/NextStepsSection';
import GranteesSection from '../../components/career-transition-grant/GranteesSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'career-transition-grant';
const FALLBACK_NAME = 'Career Transition Grants';
const HERO_DESCRIPTION = 'Funding and support for people ready to make a full-time transition into work that reduces catastrophic risks from advanced AI or biological threats.';

const CareerTransitionGrantPage = ({ programName }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getCareerTransitionGrantStats.useQuery();
  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingAwardedLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';
  const avgDaysToDecisionLabel = stats?.averageDaysToDecision != null ? String(stats.averageDaysToDecision) : '—';

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={HERO_DESCRIPTION} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={HERO_DESCRIPTION}
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
          { label: 'Avg days to decision', value: avgDaysToDecisionLabel },
        ]}
      />
      <WhatThisIsForSection />
      <WhatWeLookForSection />
      <WhatYouReceiveSection />
      <ExpectationsSection />
      <ApplicationPreviewSection />
      <NextStepsSection />
      <GranteesSection />
      <GrantFaqSection program="career-transition-grant" />
      <GrantCta program="career-transition-grant" />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: HERO_DESCRIPTION },
);

CareerTransitionGrantPage.pageRendersOwnNav = true;

export default CareerTransitionGrantPage;
