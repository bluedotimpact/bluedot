import { Section } from '@bluedot/ui';
import GranteesListSection from '../grants/GranteesListSection';

const FundedProjectsSection = () => {
  return (
    <div id="grants-made">
      <Section className="rapid-grants-funded-section" title="Projects we have funded">
        <GranteesListSection previewRows={2} />
      </Section>
    </div>
  );
};

export default FundedProjectsSection;
