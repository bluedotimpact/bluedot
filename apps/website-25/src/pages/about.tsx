import {
  HeroSection,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import JoinUsCta from '../components/about/JoinUsCta';

const AboutPage = () => {
  return (
    <div>
      <HeroSection
        title="Our mission is to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection title="Why do we exist?" />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
    </div>
  );
};

export default AboutPage;
