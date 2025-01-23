import {
  HeroSection,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import CareersCallout from '../components/careers/CareersCallout';

const AboutPage = () => {
  return (
    <div>
      <HeroSection
        title="Our mission is to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection title="Why do we exist?" />
      <HistorySection />
      <TeamSection />
      <CareersCallout />
    </div>
  );
};

export default AboutPage;
