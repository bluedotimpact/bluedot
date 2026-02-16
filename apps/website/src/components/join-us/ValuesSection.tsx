import { Card, P, Section, SlideList } from '@bluedot/ui';
import { isMobile } from 'react-device-detect';

const values = [
  {
    desktopImageSrc: '/images/values/mission.gif',
    mobileImageSrc: '/images/values/mission_mobile.gif',
    title: 'Own the mission',
    subtitle: 'We prioritize mission success above all, take responsibility for outcomes, and commit extraordinary effort to achieve extraordinary goals.',
  },
  {
    desktopImageSrc: '/images/values/fast.gif',
    mobileImageSrc: '/images/values/fast_mobile.gif',
    title: 'Find the fastest, best way to do everything',
    subtitle: 'We\'re high agency: constantly growing our skills, finding creative solutions, and making the impossible possible.',
  },
  {
    desktopImageSrc: '/images/values/speak.gif',
    mobileImageSrc: '/images/values/speak_mobile.gif',
    title: 'Say the uncomfortable truth',
    subtitle: 'We speak essential truths with kindness: giving feedback, challenging ideas, and supporting each other\'s growth.',
  },
] as const;

const ValuesSection = () => {
  return (
    <Section title="Our values" className="values-section">
      {isMobile ? (
        <div className="values-section__values--mobile flex flex-col gap-4">
          {values.map((value) => (
            <div key={value.title} className="values-card flex flex-row gap-4">
              <img
                className="values-card__image object-cover rounded-lg size-[102px]"
                src={value.mobileImageSrc}
                alt={`${value.title}`}
              />
              <div className="values-card__content">
                <p className="values-card__title bluedot-h4 mb-2">{value.title}</p>
                {value.subtitle && (<P className="values-card__subtitle">{value.subtitle}</P>)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SlideList
          maxItemsPerSlide={3}
          className="values-section__values--desktop"
        >
          {values.map((value) => (
            <Card key={value.title} imageSrc={value.desktopImageSrc} {...value} className="values-section__value w-[350px]" />
          ))}
        </SlideList>
      )}
    </Section>
  );
};

export default ValuesSection;
