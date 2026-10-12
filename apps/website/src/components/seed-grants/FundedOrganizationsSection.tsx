import { ListGroup } from '@bluedot/ui';
import { EditorialGranteeRow, type PublicRapidGrant } from '../grants/GranteesListSection';

// Funded before Seed Grants existed, through Rapid Grants, Career Transition
// Grants and the former AGI Strategy Fund, so no single Airtable view holds
// them. Move to Airtable once Seed Grants have their own published grants.
const FUNDED_ORGANIZATIONS: PublicRapidGrant[] = [
  { projectTitle: 'Recurrent Research', projectSummary: 'Research on data poisoning during pre-training.' },
  { projectTitle: 'Exona', projectSummary: 'Insurance for catastrophic risks from AI.', link: 'https://www.exonalab.com/' },
  { projectTitle: 'Arq Foundation', projectSummary: 'A European organization working on the transition to advanced AI.', link: 'https://arq.foundation/' },
  { projectTitle: 'Golemet', projectSummary: 'Research on collusion between AI agents.' },
  { projectTitle: 'Foldguard', projectSummary: 'DNA synthesis screening.', link: 'https://foldguard.bio/' },
  { projectTitle: 'Formation Research', projectSummary: 'Research on lock-in and concentration of power.', link: 'https://www.formationresearch.org/' },
].map((organization) => ({ ...organization, granteeName: '', amountUsd: null }));

const FundedOrganizationsSection = () => {
  return (
    <section id="organizations-funded" className="section-base scroll-mt-28 seed-grant-funded-section">
      <div className="border-b border-bluedot-navy/15 py-10 bd-md:py-12">
        <h2 className="mb-8 text-size-lg font-medium tracking-tight">Organizations we&apos;ve helped fund</h2>
        <ListGroup>
          {FUNDED_ORGANIZATIONS.map((organization) => (
            <EditorialGranteeRow key={organization.projectTitle} grantee={organization} />
          ))}
        </ListGroup>
      </div>
    </section>
  );
};

export default FundedOrganizationsSection;
