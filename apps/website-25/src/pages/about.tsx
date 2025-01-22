import {
  HeroSection,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';

const AboutPage = () => {
  return (
    <div>
      <HeroSection
        title="Our mission is to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection />
      <HistorySection />
    </div>
  );
};

export default AboutPage;
