// import { CommunityStats } from './CommunityStats';
// import { GovernanceProjects } from './GovernanceProjects';
import { Section } from '@bluedot/ui';
import TestimonialSection from './TestimonialSection';

const CommunitySection = () => {
  return (
    <Section title="Our community">
      {/* <CommunityStats />
      <GovernanceProjects /> */}
      <TestimonialSection />
    </Section>
  );
};

export default CommunitySection;