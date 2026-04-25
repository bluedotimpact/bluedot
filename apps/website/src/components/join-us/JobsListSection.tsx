import { P } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { PageListGroup, PageListRow, pageSectionHeadingClass } from '../PageListRow';

type JobsListSectionProps = inferRouterOutputs<AppRouter>['jobs']['getAll'];

const JobsListSection = ({ jobs }: { jobs: JobsListSectionProps }) => {
  // Split jobs into regular and contractor positions
  // job.category is a single string value from Airtable
  const regularJobs = jobs
    .filter((job) => job.category !== 'Contractor')
    .sort((a, b) => (a.slug === 'talent' ? 1 : 0) - (b.slug === 'talent' ? 1 : 0));
  const contractorJobs = jobs.filter((job) => job.category === 'Contractor');

  const renderRow = (job: JobsListSectionProps[number]) => (
    <PageListRow
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
            <h3 className={`${pageSectionHeadingClass} mb-6`}>Open roles</h3>
            <P>We're not currently running any open hiring rounds at the moment.</P>
          </>
        ) : (
          <PageListGroup label="Open roles">
            {regularJobs.map(renderRow)}
          </PageListGroup>
        )}
      </section>

      {contractorJobs.length > 0 && (
        <section className="section section-body">
          <PageListGroup label="Support our mission">
            {contractorJobs.map(renderRow)}
          </PageListGroup>
        </section>
      )}
    </>
  );
};

export default JobsListSection;
