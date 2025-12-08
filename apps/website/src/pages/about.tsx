import {
  Breadcrumbs,
  CTALinkOrButton,
  HeroH1,
  HeroSection,
  HeroCTAContainer,
  P,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import JoinUsCta from '../components/about/JoinUsCta';
import BeliefsSection from '../components/about/BeliefsSection';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.about;

const AboutPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Our mission is to build the workforce needed to safely navigate AGI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>{CURRENT_ROUTE.title}</HeroMiniTitle>
        <HeroH1>Our mission is to build the workforce needed to safely navigate AGI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url={ROUTES.joinUs.url} withChevron>Join us</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <IntroSection />
      <BeliefsSection />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
      <Section title="Contact us">
        <P>We love hearing from people, and are keen for people to reach out to us with any questions or feedback!</P>
        <CTALinkOrButton url={ROUTES.contact.url} variant="secondary" withChevron className="mt-5">Contact us</CTALinkOrButton>
      </Section>
    </div>
  );
};

export default AboutPage;
