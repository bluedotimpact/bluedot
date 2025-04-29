import { Card, CTALinkOrButton, Section } from '@bluedot/ui';
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
      {isMobile ? (
        <Card
          className="jobs-list__card--mobile container-lined p-6 max-w-full"
          title={job.title}
          subtitle={job.subtitle}
          ctaText="Learn more"
          ctaUrl={url}
        />
      ) : (
        <div className="jobs-list__card--desktop w-full flex flex-row items-center justify-between p-8 container-lined">
          <div className="flex-1">
            <strong className="jobs-list__title">{job.title}</strong>
            <P className="jobs-list__subtitle">{job.subtitle}</P>
          </div>
          <CTALinkOrButton
            className="jobs-list__cta-button"
            variant="secondary"
            withChevron
            url={url}
          >
            Learn more
          </CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default JobsListSection;
