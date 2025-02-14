// import { CommunityStats } from './CommunityStats';
import { Section } from '@bluedot/ui';
import ProjectsSubSection from './ProjectsSubSection';
import TestimonialSection from './TestimonialSection';
import CommunityValuesSection from './CommunityValuesSection';

const CommunitySection = () => {
  return (
    <Section className="community-section">
      <div className="community-section__sub-sections flex flex-col">
        <CommunityValuesSection />
        <ProjectsSubSection />
        <TestimonialSection />
      </div>
    </Section>
  );
};

export default CommunitySection;
