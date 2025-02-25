// TODO: Remove this file once the 301 redirect to /join-us is live
import {
  HeroSection,
  HeroH1,
  HeroCTAContainer,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import Head from 'next/head';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import CareersSection from '../components/join-us/CareersSection';
import CultureSection from '../components/join-us/CultureSection';
import ValuesSection from '../components/join-us/ValuesSection';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.joinUs;

const CareersPage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI." />
        <meta name="canonical" content="https://bluedot.com/join-us" />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Join Us</HeroMiniTitle>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="#open-roles-anchor" withChevron>See open roles</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <CultureSection />
      <ValuesSection />
      <CareersSection />
    </div>
  );
};

export default CareersPage;
