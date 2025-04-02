import {
  HeroSection,
  HeroCTAContainer,
  HeroH1,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAi;

const FutureOfAiCoursePage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Our mission is to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>{CURRENT_ROUTE.title}</HeroMiniTitle>
        <HeroH1>No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url={ROUTES.joinUs.url}>Start learning for free</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />

    </div>
  );
};

export default FutureOfAiCoursePage;
