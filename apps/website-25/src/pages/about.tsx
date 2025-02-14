import {
  CTALinkOrButton,
  HeroSection,
  HeroH1,
  HeroCTAContainer,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import JoinUsCta from '../components/about/JoinUsCta';
import BeliefsSection from '../components/about/BeliefsSection';

const AboutPage = () => {
  return (
    <div>
      <Head>
        <title>Join our team | BlueDot Impact</title>
        <meta name="description" content="Our mission is to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroH1>Our mission is to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="/careers" withChevron>Join the team</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <IntroSection />
      <BeliefsSection />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
      <Section
        title="Contact us"
        subtitle={<>We love hearing from people, and are keen for people to reach out to us with any questions or feedback!<br /><br />Email us at <a href="mailto:team@bluedot.org">team@bluedot.org</a>.</>}
      />
    </div>
  );
};

export default AboutPage;
