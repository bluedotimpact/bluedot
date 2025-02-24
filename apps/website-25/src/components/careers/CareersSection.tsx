import { Card, CTALinkOrButton, Section } from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import { CURRENT_ROUTE as SWE_CONTRACTOR } from '../../pages/careers/swe-contractor';
import { CURRENT_ROUTE as AIS_TEACHING_FELLOW } from '../../pages/careers/ai-safety-teaching-fellow';

const CareersSection = () => {
  return (
    <Section className="careers-section" title="Careers at BlueDot Impact">
      <div id="open-roles-anchor" className="invisible relative bottom-48" />
      <div className="careers-section__container flex flex-col gap-8">
        <JobListing {...SWE_CONTRACTOR} />
        <JobListing {...AIS_TEACHING_FELLOW} />
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
    <div className="careers-section__listing">
      {isMobile ? (
        <Card
          className="careers-section__card--mobile container-lined p-6 max-w-full"
          title={title}
          subtitle={`${location} • ${type}`}
          ctaText="Apply now"
          ctaUrl={url}
          isExternalUrl={isExternalUrl}
        />
      ) : (
        <div className="careers-section__card--desktop w-full flex flex-row items-center justify-between p-8 container-lined">
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
      )}
    </div>
  );
};

export default CareersSection;
