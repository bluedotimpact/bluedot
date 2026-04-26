import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/1-1-advising/WhatThisIsForSection';
import WhatToExpectSection from '../../components/1-1-advising/WhatToExpectSection';
import HowItWorksSection from '../../components/1-1-advising/HowItWorksSection';
import WhatMakesStrongApplicationSection from '../../components/1-1-advising/WhatMakesStrongApplicationSection';
import AdvisorsSection from '../../components/1-1-advising/AdvisorsSection';

const PAGE_TITLE = '1-1 advising';

const OneOnOneAdvisingPage = () => {
  return (
    <div>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="20 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety."
        />
      </Head>
      <MarketingHero
        title="1-1 advising"
        subtitle="20 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety."
      />
      <GrantStatsStrip
        program="1-1-advising"
        stats={[
          { label: 'Advising calls done', value: '200+' },
          { label: 'Decision time', value: '~5 working days' },
        ]}
      />
      <WhatThisIsForSection />
      <WhatToExpectSection />
      <HowItWorksSection />
      <WhatMakesStrongApplicationSection />
      <AdvisorsSection />
      <GrantFaqSection program="1-1-advising" />
      <GrantCta program="1-1-advising" />
    </div>
  );
};

OneOnOneAdvisingPage.pageRendersOwnNav = true;

export default OneOnOneAdvisingPage;
