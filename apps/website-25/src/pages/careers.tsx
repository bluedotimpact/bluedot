import {
  HeroSection,
  Section,
  ValueCard,
} from '@bluedot/ui';
import IntroSection from '../components/about/IntroSection';
import CareersSection from '../components/careers/CareersSection';

const CareersPage = () => {
  return (
    <div>
      <HeroSection
        title="Join us in our mission to ensure humanity safely navigates the transition to transformative AI."
      />
      <IntroSection title="Our culture" />
      <Section title="Our values" />
      <div className="flex justify-center gap-8 px-16 my-16">
        <ValueCard
          icon="icons/lightning_bolt_blue.svg"
          title="Think hard, act fast, fail faster"
          description="We think critically about our goals and the best path to achieve them. We learn by building rapid experiments, failing fast, measuring the results, and updating."
        />
        <ValueCard
          icon="icons/heart_blue.svg"
          title="Care personally, challenge directly"
          description="We care about our team and our community, and we hold everyone to high standards."
        />
        <ValueCard
          icon="icons/solvers.svg"
          title="Obsessed with empowering problem-solvers"
          description="We exist to support others to solve the world's biggest problems. We go above and beyond to accelerate our community's impact."
        />
      </div>
      <CareersSection />
    </div>
  );
};

export default CareersPage;
