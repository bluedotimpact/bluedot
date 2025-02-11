import {
  Card,
  SlideItem,
  SlideList,
} from '@bluedot/ui';

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
    <div className="community-values-section mt-4">
      <SlideList
        itemsPerSlide={4}
        slidesWrapperWidth="100%"
        slideClassName="px-2"
      >
        {values.map((value) => (
          <SlideItem key={value.title}>
            <Card {...value} className="community-values-section__value" />
          </SlideItem>
        ))}
      </SlideList>
    </div>
  );
};

export default CommunityValuesSection;
