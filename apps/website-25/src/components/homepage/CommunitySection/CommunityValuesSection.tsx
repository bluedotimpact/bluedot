import {
  Card, Section, SectionHeading, SlideList,
} from '@bluedot/ui';
import clsx from 'clsx';
import React from 'react';

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
    <div className="community-values-section">
      <SectionHeading title="Our community" className="community-values-section__heading" />
      <SlideList maxItemsPerSlide={4} className="community-values-section__values">
        {values.map((value) => (
          <Card {...value} className="community-values-section__value" />
        ))}
      </SlideList>
    </div>
  );
};

export default CommunityValuesSection;
