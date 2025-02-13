import { Card, Section } from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';

const beliefs = [
  {
    imageSrc: '/images/beliefs/agi.png',
    title: 'AGI could arrive soon, and we\'re unprepared',
    subtitle: 'Human-level AI will likely be built within years, not decades. Our technical, political, and social systems are not prepared to handle it safely, and the default path leads to catastrophic outcomes.',
  },
  {
    imageSrc: '/images/beliefs/matters.png',
    title: 'What we do now matters',
    subtitle: 'The future of AI isn\'t set in stone. Our choices today will determine whether this technology helps or harms humanity.',
  },
  {
    imageSrc: '/images/beliefs/key.png',
    title: 'The right people at key moments rewrite history',
    subtitle: 'Throughout history, capable individuals in key positions have steered powerful technologies toward better outcomes. By identifying, training, and mobilising exceptional people, we can guide AI toward a safe and beneficial future.',
  },
  {
    imageSrc: '/images/beliefs/urgency.png',
    title: 'We need urgency, wisdom and optimism',
    subtitle: 'The stakes are vast and time is short, but panic and fatalism do more harm than good. We need rapid, coordinated action informed by evidence and guided by hope.',
  },
] as const;

const BeliefsSection = () => {
  return (
    <Section className="beliefs-section" title="Our core beliefs">
      <SlideList
        maxItemsPerSlide={4}
      >
        {beliefs.map((belief) => (
          <Card {...belief} className="beliefs-section__belief" />
        ))}
      </SlideList>
    </Section>
  );
};

export default BeliefsSection;
