import { Card, SlideList } from '@bluedot/ui';

const values = [
  {
    imageSrc: '/images/community-values/network.png',
    title: 'Our online community brings together 4,500+ professionals across 100+ countries',
  },
  {
    imageSrc: '/images/community-values/people.png',
    title: 'Diverse expertise, from engineers and entrepreneurs to policymakers and philosophers',
  },
  {
    imageSrc: '/images/community-values/study.png',
    title: '40+ independent study groups worldwide have used our materials to run their own courses',
  },
  {
    imageSrc: '/images/community-values/world.png',
    title: 'We run regular in-person events across the world, turning online connections into lasting relationships',
  },
] as const;

const CommunityValuesSection = () => {
  return (
    <SlideList title="Our community" maxItemsPerSlide={4} className="community-values-section pb-spacing-y">
      {values.map((value) => (
        <Card {...value} className="community-values-section__value" />
      ))}
    </SlideList>
  );
};

export default CommunityValuesSection;
