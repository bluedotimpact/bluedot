import {
  HeroSection,
  HeroH1,
} from '@bluedot/ui';
import Head from 'next/head';
import IntroSection from '../components/about/IntroSection';
import CareersSection from '../components/careers/CareersSection';
import ValuesSection from '../components/careers/ValuesSection';

const CareersPage = () => {
  return (
    <div>
      <Head>
        <title>Join the team at BlueDot Impact</title>
        <meta name="description" content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
      </HeroSection>
      <IntroSection title="Our culture" />
      <ValuesSection />
      <CareersSection />
    </div>
  );
};

export default CareersPage;
