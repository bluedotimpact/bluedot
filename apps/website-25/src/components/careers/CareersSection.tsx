import { Section } from '@bluedot/ui';

const CareersSection = () => {
  return (
    <Section className="careers-section" title="Careers at BlueDot Impact">
      <div className="careers-section__container flex flex-col gap-8 my-14">
        <JobListing title="Head of Communications and Marketing" location="London, Remote" />
        <JobListing title="Head of Communications and Marketing" location="London, Remote" />
        <JobListing title="Head of Communications and Marketing" location="London, Remote" />
        <JobListing title="Head of Communications and Marketing" location="London, Remote" />
      </div>
    </Section>
  );
};

const JobListing = ({ title, location, now }: { title: string, location: string, now?: boolean }) => {
  return (
    <div className={
        `careers-section__location-container w-full flex flex-row gap-12 p-8 border-solid border rounded-2xl
          ${now ? 'bg-bluedot-lighter border-bluedot-light' : 'border-gray-200'}`
      }
    >
      <strong className="careers-section__title">{title}</strong>
      <p className="careers-section__location-title">{location}</p>
    </div>
  );
};

export default CareersSection;
