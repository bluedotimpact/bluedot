import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/advising/WhatThisIsForSection';
import WhoYouAreSection from '../../components/advising/WhoYouAreSection';
import WhatToExpectSection from '../../components/advising/WhatToExpectSection';
import RecommendedReadingSection from '../../components/advising/RecommendedReadingSection';
import HowItWorksSection from '../../components/advising/HowItWorksSection';
import AdvisorsSection from '../../components/advising/AdvisorsSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'advising';
const FALLBACK_NAME = '1-1 advising';
const FALLBACK_DESCRIPTION = '30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety.';

const OneOnOneAdvisingPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getOneOnOneAdvisingStats.useQuery();
  const avgDaysToDecisionLabel = stats?.averageDaysToDecision != null ? String(stats.averageDaysToDecision) : '—';

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
          url: '/programs/advising',
          parentPages: [ROUTES.home, ROUTES.programs],
        }}
      />
      <GrantStatsStrip
        program="advising"
        stats={[
          { label: 'Advising calls done', value: '200+' },
          { label: 'Avg days to decision', value: avgDaysToDecisionLabel },
        ]}
      />
      <WhatThisIsForSection />
      <WhoYouAreSection />
      <WhatToExpectSection />
      <RecommendedReadingSection />
      <HowItWorksSection />
      <AdvisorsSection />
      <GrantFaqSection program="advising" />
      <GrantCta program="advising" />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: FALLBACK_DESCRIPTION },
);

OneOnOneAdvisingPage.pageRendersOwnNav = true;

export default OneOnOneAdvisingPage;
