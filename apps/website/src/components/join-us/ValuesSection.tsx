import {
  Card, P, Section, SlideList,
} from '@bluedot/ui';

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
      <div className="flex flex-col gap-4 md:hidden">
        {values.map((value) => (
          <div key={value.title} className="flex flex-row gap-4">
            <img
              className="object-cover rounded-lg size-[102px]"
              src={value.mobileImageSrc}
              alt={`${value.title}`}
            />
            <div>
              <p className="bluedot-h4 mb-2">{value.title}</p>
              {value.subtitle && (<P>{value.subtitle}</P>)}
            </div>
          </div>
        ))}
      </div>
      <SlideList
        maxItemsPerSlide={3}
        className="hidden md:flex"
      >
        {values.map((value) => (
          <Card key={value.title} imageSrc={value.desktopImageSrc} {...value} className="w-[350px]" />
        ))}
      </SlideList>
    </Section>
  );
};

export default ValuesSection;
