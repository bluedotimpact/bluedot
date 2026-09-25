import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import StatsStrip from '../../components/StatsStrip';
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
import { type GrantTypeSlug } from '../../lib/grantTypes';

const GRANT_TYPE: GrantTypeSlug = 'career-transition';
const FALLBACK_NAME = 'Career Transition Grants';
const HERO_DESCRIPTION = 'Funding and support for people ready to make a full-time transition into work that reduces catastrophic risks from advanced AI or biological threats.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const PAGE_PATH = '/grants/career-transition';

const CareerTransitionGrantPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getCareerTransitionGrantStats.useQuery();
  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingAwardedLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';
  const avgDaysToDecisionLabel = stats?.averageDaysToDecision != null ? String(stats.averageDaysToDecision) : '—';

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
        <link rel="canonical" href={`${SITE_URL}${PAGE_PATH}`} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={programDescription}
      />
      <Breadcrumbs
        route={{
          title: programName,
          url: PAGE_PATH,
          parentPages: [ROUTES.home, ROUTES.grants],
        }}
      />
      <StatsStrip
        slug={GRANT_TYPE}
        compact
        stats={[
          { label: 'Grant funding', value: 'Up to $200k' },
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
      <GrantFaqSection grantType={GRANT_TYPE} />
      <GrantCta grantType={GRANT_TYPE} />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  GRANT_TYPE,
  { programName: FALLBACK_NAME, programDescription: HERO_DESCRIPTION },
);

CareerTransitionGrantPage.pageRendersOwnNav = true;

export default CareerTransitionGrantPage;
