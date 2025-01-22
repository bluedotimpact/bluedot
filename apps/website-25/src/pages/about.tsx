import {
  HeroSection,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';

const AboutPage = () => {
  return (
    <div>
      <HeroSection
        title="Our mission is to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection />
    </div>
  );
};

export default AboutPage;
