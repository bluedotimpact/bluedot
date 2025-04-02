import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { ROUTES } from '../../../../lib/routes';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit1;

const FutureOfAiCourseUnit1Page = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Our mission is to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Future of AI</HeroMiniTitle>
        <HeroH1>Beyond chatbots: the expanding frontier of AI capabilities</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />

    </div>
  );
};

export default FutureOfAiCourseUnit1Page;
