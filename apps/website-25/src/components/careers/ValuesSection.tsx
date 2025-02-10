import { Section, ValueCard } from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';

const values = [
  {
    icon: 'icons/fast.svg',
    title: 'Think hard, act fast, fail faster',
    description: 'We think critically about our goals and the best path to achieve them. We learn by building rapid experiments, failing fast, measuring the results, and updating.',
  },
  {
    icon: 'icons/care.svg',
    title: 'Care personally, challenge directly',
    description: 'We care about our team and our community, and we hold everyone to high standards.',
  },
  {
    icon: 'icons/solvers.svg',
    title: 'Obsessed with empowering problem-solvers',
    description: "We exist to support others to solve the world's biggest problems. We go above and beyond to accelerate our community's impact.",
  },
] as const;

const ValuesSection = () => {
  return (
    <Section className="values-section" title="Our values">
      <SlideList
        maxItemsPerSlide={3}
        slideClassName="px-2"
      >
        {values.map((value) => (
          <ValueCard
            icon={value.icon}
            title={value.title}
            description={value.description}
          />
        ))}
      </SlideList>
    </Section>
  );
};

export default ValuesSection;
