import {
  CourseCard,
  constants,
} from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';
import { withClickTracking } from '../../lib/withClickTracking';

const featuredCourse = constants.COURSES.find((course) => course.title === 'AI Safety: Intro to Transformative AI')!;

const CourseCardWithTracking = withClickTracking(CourseCard, {
  eventName: 'course_card_click',
});

const CourseSection = () => {
  return (
    <SlideList
      title="Our courses"
      subtitle="Our courses combine self-paced study with guided discussions, deepening your learning while fostering connections in the field"
      subtitleLevel="p"
      className="course-section section-body"
      maxItemsPerSlide={2}
      minItemWidth={300}
      featuredSlot={(
        <CourseCardWithTracking
          trackingEventParams={{ course_title: featuredCourse.title, course_url: featuredCourse.href }}
          {...featuredCourse}
          cardType="Featured"
          className="h-full"
        />
      )}
    >
      {constants.COURSES.filter((course) => course !== featuredCourse).map((course) => (
        <CourseCardWithTracking trackingEventParams={{ course_title: course.title, course_url: course.href }} key={course.title} {...course} />
      ))}
    </SlideList>
  );
};

export default CourseSection;
