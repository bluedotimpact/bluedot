import GranteesListSection from '../grants/GranteesListSection';

// TODO: replace with pageSectionHeadingClass from ../PageListRow once #2309 lands
const SECTION_HEADING_CLASS = 'text-[24px] font-bold tracking-[-0.4px] leading-[1.333] text-bluedot-navy';

const FundedProjectsSection = () => {
  return (
    <section id="grants-made" className="section section-body rapid-grants-funded-section">
      <div className="w-full min-[680px]:max-w-[1120px] min-[680px]:mx-auto flex flex-col gap-6">
        <h3 className={SECTION_HEADING_CLASS}>Projects we&apos;ve funded</h3>
        <GranteesListSection previewRows={2} />
      </div>
    </section>
  );
};

export default FundedProjectsSection;
