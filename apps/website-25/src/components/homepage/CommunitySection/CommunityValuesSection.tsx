import {
  Card,
  Section,
  SlideItem,
  SlideList,
} from '@bluedot/ui';

const values = [
  {
    imageSrc: '/images/beliefs/agi.png', // TODO update
    title: 'Our online community brings together 4,500+ professionals across 100+ countries',
  },
  {
    imageSrc: '/images/beliefs/agi.png', // TODO update
    title: 'Diverse expertise, from engineers and entrepreneurs to policymakers and philosophers',
  },
  {
    imageSrc: '/images/beliefs/agi.png', // TODO update
    title: '40+ independent study groups worldwide have used our materials to run their own courses',
  },
  {
    imageSrc: '/images/beliefs/agi.png', // TODO update
    title: 'We run regular in-person events across the world, turning online connections into lasting relationships',
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
          <SlideItem key={value.title}>
            <Card
              imageSrc={value.imageSrc}
              title={value.title}
              className="community-values-section__value"
              isEntireCardClickable
            />
          </SlideItem>
        ))}
      </SlideList>
    </Section>
  );
};

export default CommunityValuesSection;
