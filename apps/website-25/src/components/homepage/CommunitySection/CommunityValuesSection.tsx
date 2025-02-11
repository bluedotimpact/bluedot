import {
  Section,
  SlideItem,
  SlideList,
  ValueCard,
} from '@bluedot/ui';

const values = [
  {
    icon: 'icons/network_dark.svg',
    description: 'Our online community brings together 4,500+ professionals across 100+ countries',
  },
  {
    icon: 'icons/people.svg',
    description: 'Diverse expertise, from engineers and entrepreneurs to policymakers and philosophers',
  },
  {
    icon: 'icons/study.svg',
    description: '40+ independent study groups worldwide have used our materials to run their own courses',
  },
  {
    icon: 'icons/world.svg',
    description: 'We run regular in-person events across the world, turning online connections into lasting relationships',
  },
] as const;

const CommunityValuesSection = () => {
  return (
    <Section className="community-values-section">
      <SlideList
        itemsPerSlide={4}
        slidesWrapperWidth="100%"
        slideClassName="px-2"
      >
        {values.map((value) => (
          <SlideItem key={value.icon}>
            <ValueCard
              icon={value.icon}
              description={value.description}
              dark
              className="community-values-section__value"
            />
          </SlideItem>
        ))}
      </SlideList>
    </Section>
  );
};

export default CommunityValuesSection;
