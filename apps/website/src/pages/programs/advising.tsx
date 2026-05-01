import { Breadcrumbs } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/advising/WhatThisIsForSection';
import WhoYouAreSection from '../../components/advising/WhoYouAreSection';
import WhatToExpectSection from '../../components/advising/WhatToExpectSection';
import HowItWorksSection from '../../components/advising/HowItWorksSection';
import AdvisorsSection from '../../components/advising/AdvisorsSection';
import { ROUTES } from '../../lib/routes';

const PAGE_TITLE = '1-1 advising';

const OneOnOneAdvisingPage = () => {
  return (
    <div>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety."
        />
      </Head>
      <MarketingHero
        title="1-1 advising"
        subtitle="30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety."
      />
      <Breadcrumbs
        route={{
          title: PAGE_TITLE,
          url: '/programs/advising',
          parentPages: [ROUTES.home, ROUTES.programs],
        }}
      />
      <GrantStatsStrip
        program="advising"
        stats={[
          { label: 'Advising calls done', value: '200+' },
          { label: 'Decision time', value: '~5 working days' },
        ]}
      />
      <WhatThisIsForSection />
      <WhoYouAreSection />
      <WhatToExpectSection />
      <HowItWorksSection />
      <AdvisorsSection />
      <GrantFaqSection program="advising" />
      <GrantCta program="advising" />
    </div>
  );
};

OneOnOneAdvisingPage.pageRendersOwnNav = true;

export default OneOnOneAdvisingPage;
