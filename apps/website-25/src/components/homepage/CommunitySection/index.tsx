// import { CommunityStats } from './CommunityStats';
import { Section } from '@bluedot/ui';
import GovernanceProjects from './GovernanceProjects';
import TestimonialSection from './TestimonialSection';
import CommunityValuesSection from './CommunityValuesSection';

const CommunitySection = () => {
  return (
    <Section title="Our community">
      <CommunityValuesSection />
      <GovernanceProjects />
      <TestimonialSection />
    </Section>
  );
};

export default CommunitySection;
