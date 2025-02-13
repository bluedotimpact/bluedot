import {
  CourseCard,
  Section,
  constants,
} from '@bluedot/ui';
import { SlideList, SlideItem } from '@bluedot/ui/src/SlideList';

const featuredCourse = constants.COURSES.find((course) => course.title === 'AI Safety: Intro to Transformative AI')!;

const CourseSection = () => {
  return (
    <Section>
      <SlideList
        title="Our courses"
        description="We run inclusive, blended learning courses that cater to various expertise levels and time availability"
        itemsPerSlide={2}
        featuredSlot={(
          <CourseCard
            {...featuredCourse}
            cardType="Featured"
            className="h-full"
          />
        )}
        slidesWrapperWidth={{ mobile: '100%', desktop: '800px' }}
        containerClassName="gap-space-between"
      >
        {constants.COURSES.filter((course) => course !== featuredCourse).map((course) => (
          <SlideItem key={course.title}>
            <CourseCard
              {...course}
              className="w-full md:w-[323px]"
            />
          </SlideItem>
        ))}
      </SlideList>
    </Section>
  );
};

export default CourseSection;
