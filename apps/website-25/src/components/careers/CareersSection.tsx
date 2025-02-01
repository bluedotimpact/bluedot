import { CTALinkOrButton, Section } from '@bluedot/ui';

const CareersSection = () => {
  return (
    <Section className="careers-section" title="Careers at BlueDot Impact">
      <div className="careers-section__container flex flex-col gap-8">
        <JobListing title="AI Alignment Project Judge" url="https://bluedot.org/ai-alignment-project-judge/" isExternalUrl />
        <JobListing title="Course Operations Specialist" url="https://bluedot.org/ai-safety-course-operations/" isExternalUrl />
        <JobListing title="Software Engineering Contractor" url="https://bluedot.org/swe-contractor/" isExternalUrl />
        <JobListing title="Economics of Transformative AI Teaching Fellow" url="https://bluedot.org/economics-of-tai-teaching-fellow/" isExternalUrl />
      </div>
    </Section>
  );
};

const JobListing = ({
  title, location = 'London, Remote', type = 'Permanent', url, isExternalUrl = false,
}: {
  title: string, location?: string, type?: string, url?: string, isExternalUrl?: boolean
}) => {
  return (
    <div className="careers-section__location-container w-full flex flex-row items-center justify-between p-8 container-lined">
      <strong className="careers-section__title basis-[33%]">{title}</strong>
      <p className="careers-section__location">{location}</p>
      <p className="careers-section__type">{type}</p>
      <CTALinkOrButton
        className="careers-section__cta-button"
        variant="secondary"
        withChevron
        url={url}
        isExternalUrl={isExternalUrl}
      >
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

export default CareersSection;
