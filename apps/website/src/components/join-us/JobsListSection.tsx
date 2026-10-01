import {
  H3, P, ListGroup, ListRow,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';

type JobsListSectionProps = inferRouterOutputs<AppRouter>['jobs']['getAll'];

const JobsListSection = ({ jobs }: { jobs: JobsListSectionProps }) => {
  // Split jobs into regular and contractor positions. Ordering is set by the
  // router (Airtable Prio field), so the component just preserves it.
  const regularJobs = jobs.filter((job) => job.category !== 'Contractor');
  const contractorJobs = jobs.filter((job) => job.category === 'Contractor');

  const renderRow = (job: JobsListSectionProps[number]) => (
    <ListRow
      key={job.id}
      href={`${ROUTES.joinUs.url}/${job.slug}`}
      title={job.title ?? ''}
      summary={job.subtitle ?? undefined}
    />
  );

  return (
    <>
      <section className="section section-body">
        <div id="open-roles-anchor" className="invisible relative bottom-48" />
        {regularJobs.length === 0 ? (
          <>
            <H3 className="mb-6">Open roles</H3>
            <P>We're not currently running any open hiring rounds at the moment.</P>
          </>
        ) : (
          <ListGroup label="Open roles">
            {regularJobs.map(renderRow)}
          </ListGroup>
        )}
      </section>

      {contractorJobs.length > 0 && (
        <section className="section section-body">
          <ListGroup label="Support our mission">
            {contractorJobs.map(renderRow)}
          </ListGroup>
        </section>
      )}
    </>
  );
};

export default JobsListSection;
