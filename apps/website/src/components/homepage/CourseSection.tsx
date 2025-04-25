import {
  CourseCard,
  Section,
  constants,
} from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';
import { withClickTracking } from '../../lib/withClickTracking';

const featuredCourse = constants.COURSES.find((course) => course.isFeatured)!;

const CourseCardWithTracking = withClickTracking(CourseCard, {
  eventName: 'course_card_click',
});

const CourseSection = () => {
  return (
    <Section
      className="course-section"
      title="Our courses"
      subtitle="Our courses combine self-paced study with guided discussions, deepening your learning while fostering connections in the field"
      subtitleLevel="p"
    >
      <div className="course-section__content flex flex-col lg:flex-row lg:[&>*]:[flex-basis:50%] gap-space-between items-stretch">
        <CourseCardWithTracking
          trackingEventParams={{
            course_title: featuredCourse.title,
            course_url: featuredCourse.url,
          }}
          {...featuredCourse}
          cardType="Featured"
          className="course-section__featured"
        />
        <SlideList
          maxItemsPerSlide={4}
          maxRows={1}
          minItemWidth={300}
          className="course-section__carousel"
        >
          {constants.COURSES.filter(
            (course) => course !== featuredCourse,
          ).map((course) => (
            <CourseCardWithTracking
              trackingEventParams={{
                course_title: course.title,
                course_url: course.url,
              }}
              key={course.title}
              {...course}
            />
          ))}
        </SlideList>
      </div>
    </Section>
  );
};

export default CourseSection;
