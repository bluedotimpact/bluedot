import {
  CourseCard,
  Section,
  constants,
} from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';

const featuredCourse = constants.COURSES.find((course) => course.title === 'AI Safety: Intro to Transformative AI')!;

const CourseSection = () => {
  return (
    <Section>
      <SlideList
        title="Our courses"
        description="We run inclusive, blended learning courses that cater to various expertise levels and time availability"
        maxItemsPerSlide={2}
        minItemWidth={300}
        featuredSlot={(
          <CourseCard
            {...featuredCourse}
            cardType="Featured"
            className="h-full"
          />
        )}
      >
        {constants.COURSES.filter((course) => course !== featuredCourse).map((course) => (
          <CourseCard key={course.title} {...course} className="size-full" />
        ))}
      </SlideList>
    </Section>
  );
};

export default CourseSection;
