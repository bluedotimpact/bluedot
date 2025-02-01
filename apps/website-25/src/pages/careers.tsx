import {
  HeroSection,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';
import CareersSection from '../components/careers/CareersSection';
import ValuesSection from '../components/careers/ValuesSection';

const CareersPage = () => {
  return (
    <div>
      <HeroSection
        title="Join us in our mission to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection title="Our culture" />
      <ValuesSection />
      <CareersSection />
    </div>
  );
};

export default CareersPage;
