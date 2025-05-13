import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import CultureSection from '../../components/join-us/CultureSection';
import ValuesSection from '../../components/join-us/ValuesSection';
import AshbyEmbed from '../../components/join-us/AshbyEmbed';

const CURRENT_ROUTE = ROUTES.joinUs;

const JoinUsPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Join Us</HeroMiniTitle>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="#open-roles-anchor" withChevron>See open roles</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <AshbyEmbed />
      <CultureSection />
      <ValuesSection />
    </div>
  );
};

export default JoinUsPage;
