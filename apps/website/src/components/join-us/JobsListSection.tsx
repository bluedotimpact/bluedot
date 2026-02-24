import { Card, P, Section } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';

type JobsListSectionProps = inferRouterOutputs<AppRouter>['jobs']['getAll'];

const JobsListSection = ({ jobs }: { jobs: JobsListSectionProps }) => {
  // Split jobs into regular and contractor positions
  // job.category is a single string value from Airtable
  const regularJobs = jobs
    .filter((job) => job.category !== 'Contractor')
    .sort((a, b) => (a.slug === 'talent' ? 1 : 0) - (b.slug === 'talent' ? 1 : 0));
  const contractorJobs = jobs.filter((job) => job.category === 'Contractor');

  return (
    <>
      <Section title="Open roles">
        <div id="open-roles-anchor" className="invisible relative bottom-48" />
        {regularJobs.length === 0 ? (
          <P>We're not currently running any open hiring rounds at the moment.</P>
        ) : (
          <ul className="list-none flex flex-col gap-8">
            {regularJobs.map((job) => (
              <li key={job.id}>
                <JobListItem job={job} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {contractorJobs.length > 0 && (
        <Section title="Support our mission">
          <ul className="list-none flex flex-col gap-8">
            {contractorJobs.map((job) => (
              <li key={job.id}>
                <JobListItem job={job} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
};

const JobListItem = ({ job }: { job: JobsListSectionProps[number] }) => {
  const url = `${ROUTES.joinUs.url}/${job.slug}`;

  return (
    <Card
      className="container-lined hover:container-elevated p-8"
      ctaText="Learn more"
      ctaUrl={url}
      isEntireCardClickable
      isFullWidth
      subtitle={job.subtitle ?? undefined}
      title={job.title ?? ''}
    />
  );
};

export default JobsListSection;
