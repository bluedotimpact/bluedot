import { Card, Section } from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import { P } from '../Text';
import { CmsJobPosting } from '../../lib/api/db/tables';
import { ROUTES } from '../../lib/routes';

export type GetAshbyJobsResponse = {
  jobs: {
    id: string;
    title: string;
    department: string;
    team: string;
    employmentType: string;
    location: string;
    shouldDisplayCompensationOnJobPostings: boolean;
    publishedAt: string;
    isListed: boolean;
    isRemote: boolean;
    descriptionHtml: string;
  }[]
};

export type JobsListSectionProps = {
  ashbyJobs: GetAshbyJobsResponse['jobs']
  cmsJobs: Omit<CmsJobPosting, 'body'>[],
};

const JobsListSection = ({ ashbyJobs, cmsJobs }: JobsListSectionProps) => {
  const jobs = [
    ...cmsJobs.map((j) => ({ id: j.slug, title: j.title, location: j.subtitle })),
    ...ashbyJobs,
  ];

  return (
    <Section className="jobs-list-section" title="Careers at BlueDot Impact">
      <div id="open-roles-anchor" className="invisible relative bottom-48" />
      {jobs.length === 0 ? (
        <P>
          We're not currently running any open hiring rounds at the moment.
        </P>
      ) : (
        <div className="jobs-list__container flex flex-col gap-8">
          {jobs.map((job) => (
            <JobListItem key={job.id} job={job} />
          ))}
        </div>
      )}
    </Section>
  );
};

const JobListItem = ({ job }: {
  job: { id: string; title: string; location: string };
}) => {
  const url = `${ROUTES.joinUs.url}/${job.id}`;

  return (
    <div className="jobs-list__listing">
      <Card
        className="jobs-list__card container-lined hover:container-elevated p-8"
        ctaText="Learn more"
        ctaUrl={url}
        isEntireCardClickable={!isMobile}
        isFullWidth={!isMobile}
        subtitle={job.location}
        title={job.title}
      />
    </div>
  );
};

export default JobsListSection;
