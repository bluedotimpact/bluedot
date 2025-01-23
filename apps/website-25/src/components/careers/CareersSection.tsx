import { CTAButton, Section } from '@bluedot/ui';

const CareersSection = () => {
  return (
    <Section className="careers-section" title="Careers at BlueDot Impact">
      <div className="careers-section__container flex flex-col gap-8 my-14">
        <JobListing title="AI Alignment Project Judge" />
        <JobListing title="Course Operations Specialist" />
        <JobListing title="Software Engineering Contractor" />
        <JobListing title="Economics of Transformative AI Teaching Fellow" />
      </div>
    </Section>
  );
};

const JobListing = ({
  title, location = 'London, Remote', type = 'Permanent', now,
}: {
  title: string, location?: string, type?: string, now?: boolean
}) => {
  return (
    <div className={
        `careers-section__location-container w-full flex flex-row items-center justify-between p-8 border-solid border rounded-2xl
          ${now ? 'bg-bluedot-lighter border-bluedot-light' : 'border-gray-200'}`
      }
    >
      <strong className="careers-section__title basis-[33%]">{title}</strong>
      <p className="careers-section__location">{location}</p>
      <p className="careers-section__type">{type}</p>
      <CTAButton
        className="careers-section__cta-button"
        variant="secondary"
        withChevron
      >
        Apply now
      </CTAButton>
    </div>
  );
};

export default CareersSection;
