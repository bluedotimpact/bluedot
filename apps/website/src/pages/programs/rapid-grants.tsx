import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import StatsStripSection from '../../components/rapid-grants/StatsStripSection';
import WhatThisIsForSection from '../../components/rapid-grants/WhatThisIsForSection';
import HowItWorksSection from '../../components/rapid-grants/HowItWorksSection';
import FundedProjectsSection from '../../components/rapid-grants/FundedProjectsSection';
import FaqSection from '../../components/rapid-grants/FaqSection';
import Cta from '../../components/rapid-grants/Cta';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Rapid Grants',
  url: '/programs/rapid-grants',
  parentPages: [ROUTES.home, ROUTES.programs],
};

const RapidGrantsPage = () => {
  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Fast, flexible grants for BlueDot community members working on AI safety - research, events, community building, and more."
        />
      </Head>
      <MarketingHero
        title="Rapid Grants"
        subtitle="Research project, event, community chapter? We fund ambitious people doing concrete work to make AI go well."
      />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <StatsStripSection />
      <WhatThisIsForSection />
      <HowItWorksSection />
      <FundedProjectsSection />
      <FaqSection />
      <Cta />
    </div>
  );
};

export default RapidGrantsPage;
