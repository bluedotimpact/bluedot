import {
  HeroSection,
  HeroCTAContainer,
  HeroH1,
  HeroH2,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../../lib/routes';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAi;

const FutureOfAiCoursePage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Future-proof your career" />
      </Head>
      <HeroSection>
        <HeroH1>Future of AI</HeroH1>
        <HeroH2>No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.</HeroH2>
        <HeroCTAContainer>
          <CTALinkOrButton url={ROUTES.joinUs.url}>Start learning for free</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />

    </div>
  );
};

export default FutureOfAiCoursePage;
