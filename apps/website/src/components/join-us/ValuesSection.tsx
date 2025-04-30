import { Card, Section } from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';

const values = [
  {
    imageSrc: '/images/values/care.png',
    title: 'Own the mission',
    subtitle: 'We prioritize mission success above all, take responsibility for outcomes, and commit extraordinary effort to achieve extraordinary goals.',
  },
  {
    imageSrc: '/images/values/think.png',
    title: 'Find the fastest, best way to do everything',
    subtitle: 'We\'re high agency: constantly growing our skills, finding creative solutions, and making the impossible possible.',
  },
  {
    imageSrc: '/images/values/powering.png',
    title: 'Say the uncomfortable truth',
    subtitle: 'We speak essential truths with kindness: giving feedback, challenging ideas, and supporting each other\'s growth.',
  },
] as const;

const ValuesSection = () => {
  return (
    <Section title="Our values" className="values-section">
      <SlideList
        maxItemsPerSlide={3}
        className="values-section__values"
      >
        {values.map((value) => (
          <Card key={value.title} {...value} className="values-section__value" />
        ))}
      </SlideList>
    </Section>
  );
};

export default ValuesSection;
