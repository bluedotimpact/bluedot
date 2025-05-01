import { Card, Section } from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import { P } from '../Text';
import { CmsJobPosting } from '../../lib/api/db/tables';
import { ROUTES } from '../../lib/routes';

export type JobsListSectionProps = {
  jobs: Omit<CmsJobPosting, 'body'>[]
};

const JobsListSection = ({ jobs }: JobsListSectionProps) => {
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
  job: Omit<CmsJobPosting, 'body'>
}) => {
  const url = `${ROUTES.joinUs.url}/${job.slug}`;

  return (
    <div className="jobs-list__listing">
      <Card
        className="jobs-list__card container-lined"
        ctaText="Learn more"
        ctaUrl={url}
        isFullWidth={!isMobile}
        subtitle={job.subtitle}
        title={job.title}
        withCTA
      />
    </div>
  );
};

export default JobsListSection;
