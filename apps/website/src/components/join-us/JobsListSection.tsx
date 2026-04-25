import { P, Section } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { PageListGroup, PageListRow } from '../PageListRow';

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
      <Section title="Open roles">
        <div id="open-roles-anchor" className="invisible relative bottom-48" />
        <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto">
          {regularJobs.length === 0 ? (
            <P>We're not currently running any open hiring rounds at the moment.</P>
          ) : (
            <PageListGroup>
              {regularJobs.map(renderRow)}
            </PageListGroup>
          )}
        </div>
      </Section>

      {contractorJobs.length > 0 && (
        <Section title="Support our mission">
          <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto">
            <PageListGroup>
              {contractorJobs.map(renderRow)}
            </PageListGroup>
          </div>
        </Section>
      )}
    </>
  );
};

export default JobsListSection;
