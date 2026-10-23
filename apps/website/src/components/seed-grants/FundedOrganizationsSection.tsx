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
  { projectTitle: 'Compute Visibility Institute', projectSummary: 'Mapping advanced computing infrastructure using satellite imagery and open-source research.', link: 'https://computegov.com/' },
  { projectTitle: 'Plures', projectSummary: 'Building AI governance capacity in middle-power countries.', link: 'https://plures.org/' },
  { projectTitle: 'Convergent Robotics', projectSummary: 'Safety evaluations and mitigations for intelligent robots.', link: 'https://convergentrobotics.org/index.html' },
  { projectTitle: 'Sonata Labs', projectSummary: 'Evaluating AI agents on long-running, real-world tasks.', link: 'https://sonatalabs.ai/' },
  { projectTitle: 'Physical AI Safety Institute', projectSummary: 'Growing research on interpreting, aligning and controlling robot foundation models.', link: 'https://paisi.ai/' },
  { projectTitle: 'Lyptus Research', projectSummary: 'Research on dangerous AI capabilities and alignment.', link: 'https://lyptusresearch.org/' },
  { projectTitle: 'SEAR Labs', projectSummary: '' },
  { projectTitle: 'Propensity Labs', projectSummary: 'Research and tools for understanding and steering AI model behavior.', link: 'https://www.propensitylabs.ai/' },
].map((organization) => ({ ...organization, granteeName: '', amountUsd: null }));

const FundedOrganizationsSection = () => {
  return (
    <section id="organizations-funded" className="section-base scroll-mt-28 seed-grant-funded-section">
      <div className="border-b border-subtle py-10 bd-md:py-12">
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
