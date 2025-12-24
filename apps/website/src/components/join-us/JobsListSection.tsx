import { Card, P, Section } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';

type JobsListSectionProps = inferRouterOutputs<AppRouter>['jobs']['getAll'];

const JobsListSection = ({ jobs }: { jobs: JobsListSectionProps }) => {
  return (
    <Section title="Careers at BlueDot Impact">
      <div id="open-roles-anchor" className="invisible relative bottom-48" />
      {jobs.length === 0 ? (
        <P>We're not currently running any open hiring rounds at the moment.</P>
      ) : (
        <ul className="list-none flex flex-col gap-8">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobListItem job={job} />
            </li>
          ))}
        </ul>
      )}
    </Section>
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
      subtitle={job.subtitle}
      title={job.title}
    />
  );
};

export default JobsListSection;
