// import { CommunityStats } from './CommunityStats';
import { Section } from '@bluedot/ui';
import GovernanceProjects from './GovernanceProjects';
import TestimonialSection from './TestimonialSection';

const CommunitySection = () => {
  return (
    <Section title="Our community">
      {/* <CommunityStats /> */}
      <GovernanceProjects />
      <TestimonialSection />
    </Section>
  );
};

export default CommunitySection;
