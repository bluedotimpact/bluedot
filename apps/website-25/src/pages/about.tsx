import {
  HeroSection,
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
      <HeroSection
        title="Our mission is to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection title="Why do we exist?" />
      <BeliefsSection />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
    </div>
  );
};

export default AboutPage;
