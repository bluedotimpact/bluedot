import { Breadcrumbs } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/career-transition-grant/WhatThisIsForSection';
import ExpectationsSection from '../../components/career-transition-grant/ExpectationsSection';
import NextStepsSection from '../../components/career-transition-grant/NextStepsSection';
import GranteesSection from '../../components/career-transition-grant/GranteesSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const PAGE_TITLE = 'Career Transition Grants';

const CareerTransitionGrantPage = () => {
  const { data: stats } = trpc.grants.getCareerTransitionGrantStats.useQuery();
  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingAwardedLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

  return (
    <div>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Funding and support for BlueDot community members ready to work full-time on AI safety."
        />
      </Head>
      <MarketingHero
        title="Career Transition Grants"
        subtitle="Funding and support to help you work full-time on AI safety."
      />
      <Breadcrumbs
        route={{
          title: PAGE_TITLE,
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
      <GranteesSection />
      <GrantFaqSection program="career-transition-grant" />
      <GrantCta program="career-transition-grant" />
    </div>
  );
};

CareerTransitionGrantPage.pageRendersOwnNav = true;

export default CareerTransitionGrantPage;
