import { pageSectionHeadingClass } from '../PageListRow';
import GranteesListSection from '../grants/GranteesListSection';

const FundedProjectsSection = () => {
  return (
    <section id="grants-made" className="section section-body rapid-grants-funded-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Projects we&apos;ve funded</h3>
        <GranteesListSection previewRows={2} />
      </div>
    </section>
  );
};

export default FundedProjectsSection;
