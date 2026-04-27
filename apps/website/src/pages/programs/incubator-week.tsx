import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/incubator-week/WhatThisIsForSection';
import TheWeekSection from '../../components/incubator-week/TheWeekSection';
import WhatYouGetSection from '../../components/incubator-week/WhatYouGetSection';
import LogisticsSection from '../../components/incubator-week/LogisticsSection';
import { ROUTES } from '../../lib/routes';

const PAGE_TITLE = 'Incubator Week';

const CURRENT_ROUTE: BluedotRoute = {
  title: PAGE_TITLE,
  url: '/programs/incubator-week',
  parentPages: [ROUTES.home, ROUTES.programs],
};

const IncubatorWeekProgramPage = () => {
  return (
    <div>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="A 5-day intensive for founders building organizations to make AI go well. Develop threat models, design interventions, pitch for funding. All expenses paid in London."
        />
      </Head>
      <MarketingHero
        title="Incubator Week"
        subtitle="A five-day intensive that backs the strongest founders from our courses to build organizations to make AI go well. All expenses paid. Pitch for funding on Friday. 1-5 June in London."
      />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <GrantStatsStrip
        program="incubator-week"
        compact
        stats={[
          { label: 'Format', value: '5 days, in person' },
          { label: 'Location', value: 'London (LISA)' },
          { label: 'Cost', value: 'All expenses paid' },
          { label: 'Funding', value: '£50k+ on strong pitches' },
        ]}
      />
      <WhatThisIsForSection />
      <TheWeekSection />
      <WhatYouGetSection />
      <LogisticsSection />
      <GrantFaqSection program="incubator-week" />
      <GrantCta program="incubator-week" />
    </div>
  );
};

IncubatorWeekProgramPage.pageRendersOwnNav = true;

export default IncubatorWeekProgramPage;
