import GranteesListSection from '../grants/GranteesListSection';

const FundedProjectsSection = () => {
  return (
    <section id="grants-made" className="section section-body rapid-grants-funded-section">
      <div className="max-w-prose mx-auto w-full">
        <GranteesListSection heading="Projects we've funded" limit={6} />
      </div>
    </section>
  );
};

export default FundedProjectsSection;
