import GranteesListSection from '../grants/GranteesListSection';

const FundedProjectsSection = () => {
  return (
    <section id="grants-made" className="section-base scroll-mt-28 rapid-grants-funded-section">
      <div className="border-b border-bluedot-navy/15 py-10 bd-md:py-12">
        <GranteesListSection heading="Projects we've funded" limit={6} layout="editorial" />
      </div>
    </section>
  );
};

export default FundedProjectsSection;
