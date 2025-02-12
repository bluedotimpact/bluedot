import { Card, Section } from '@bluedot/ui';
import { SlideList, SlideItem } from '@bluedot/ui/src/SlideList';

const values = [
  {
    imageSrc: '/images/values/think.png',
    title: 'Think hard, act fast, fail faster',
    subtitle: 'We think critically about our goals and the best path to achieve them. We learn by building rapid experiments, failing fast, measuring the results, and updating.',
  },
  {
    imageSrc: '/images/values/care.png',
    title: 'Care personally, challenge directly',
    subtitle: 'We care about our team and our community, and we hold everyone to high standards.',
  },
  {
    imageSrc: '/images/values/powering.png',
    title: 'Obsessed with empowering problem-solvers',
    subtitle: 'We exist to support others to solve the world\'s biggest problems. We go above and beyond to accelerate our community\'s impact.',
  },
] as const;

const ValuesSection = () => {
  return (
    <Section className="values-section" title="Our values">
      <SlideList
        itemsPerSlide={3}
        slidesWrapperWidth="100%"
        slideClassName="px-2"
      >
        {values.map((value) => (
          <SlideItem key={value.title}>
            <Card {...value} className="values-section__value" />
          </SlideItem>
        ))}
      </SlideList>
    </Section>
  );
};

export default ValuesSection;
