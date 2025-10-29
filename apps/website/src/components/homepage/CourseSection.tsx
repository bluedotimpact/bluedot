import {
  CourseCard,
  Section,
  ProgressDots,
} from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';
import { withClickTracking } from '../../lib/withClickTracking';
import { useCourses } from '../../lib/hooks/useCourses';

const CourseCardWithTracking = withClickTracking(CourseCard, {
  eventName: 'course_card_click',
});

const CourseSection = () => {
  const { courses, loading } = useCourses();

  if (loading) {
    return (
      <Section>
        <ProgressDots />
      </Section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  // Find the first featured course, or fall back to the first course
  const featuredCourse = courses.find((course) => course.isFeatured) || courses[0];

  if (!featuredCourse) {
    return null;
  }

  return (
    <Section title="Courses">
      <div className="flex flex-col lg:flex-row lg:[&>*]:[flex-basis:50%] gap-space-between items-stretch">
        <CourseCardWithTracking
          trackingEventParams={{
            course_title: featuredCourse.title,
            course_url: featuredCourse.path,
          }}
          title={featuredCourse.title}
          description={featuredCourse.shortDescription}
          cadence={featuredCourse.cadence}
          courseLength={featuredCourse.durationDescription}
          imageSrc={featuredCourse.image || undefined}
          url={featuredCourse.path}
          cardType="Featured"
        />
        <SlideList
          maxItemsPerSlide={4}
          maxRows={1}
          minItemWidth={300}
        >
          {courses.filter(
            (course) => course.id !== featuredCourse.id,
          ).map((course) => (
            <CourseCardWithTracking
              trackingEventParams={{
                course_title: course.title,
                course_url: course.path,
              }}
              key={course.id}
              title={course.title}
              description={course.shortDescription}
              cadence={course.cadence}
              courseLength={course.durationDescription}
              imageSrc={course.image || undefined}
              url={course.path}
            />
          ))}
        </SlideList>
      </div>
    </Section>
  );
};

export default CourseSection;
