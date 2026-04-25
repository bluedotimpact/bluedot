import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import StatsStripSection from '../../components/career-transition-grant/StatsStripSection';
import WhatThisIsForSection from '../../components/career-transition-grant/WhatThisIsForSection';
import ExpectationsSection from '../../components/career-transition-grant/ExpectationsSection';
import SubmissionPromptsSection from '../../components/career-transition-grant/SubmissionPromptsSection';
import NextStepsSection from '../../components/career-transition-grant/NextStepsSection';
import GranteesSection from '../../components/career-transition-grant/GranteesSection';
import FaqSection from '../../components/career-transition-grant/FaqSection';
import Cta from '../../components/career-transition-grant/Cta';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Career Transition Grants',
  url: '/programs/career-transition-grant',
  parentPages: [ROUTES.home, ROUTES.programs],
};

const CareerTransitionGrantPage = () => {
  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Funding and support for BlueDot community members ready to work full-time on AI safety."
        />
      </Head>
      <MarketingHero
        title="Career Transition Grants"
        subtitle="Funding and support to help you work full-time on AI safety."
      />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <StatsStripSection />
      <WhatThisIsForSection />
      <ExpectationsSection />
      <SubmissionPromptsSection />
      <NextStepsSection />
      <GranteesSection />
      <FaqSection />
      <Cta />
    </div>
  );
};

export default CareerTransitionGrantPage;
