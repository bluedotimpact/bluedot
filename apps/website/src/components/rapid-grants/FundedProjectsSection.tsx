import GranteesListSection from '../grants/GranteesListSection';

const FundedProjectsSection = () => {
  return (
    <section id="grants-made" className="section section-body rapid-grants-funded-section">
      <GranteesListSection heading="Projects we've funded" limit={6} />
    </section>
  );
};

export default FundedProjectsSection;
