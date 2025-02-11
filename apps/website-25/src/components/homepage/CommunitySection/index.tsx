// import { CommunityStats } from './CommunityStats';
import { Section } from '@bluedot/ui';
import GovernanceProjects from './GovernanceProjects';
import TestimonialSection from './TestimonialSection';
import CommunityValuesSection from './CommunityValuesSection';

const CommunitySection = () => {
  return (
    <Section title="Our community" className="community-section">
      <div className="community-section__sub-sections flex flex-col gap-9">
        <CommunityValuesSection />
        <GovernanceProjects />
        <TestimonialSection />
      </div>
    </Section>
  );
};

export default CommunitySection;
