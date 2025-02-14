import {
  CourseCard,
  constants,
} from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';
import { addUtmParams, UTMParams } from '../../lib/utmParams';

const utmParams: UTMParams = {
  source: 'website',
  content: 'course_section',
  campaign: 'relaunch',
};

const coursesWithUtm = constants.COURSES.map((course) => ({
  ...course,
  href: addUtmParams(course.href, utmParams),
}));

const featuredCourse = coursesWithUtm.find((course) => course.title === 'AI Safety: Intro to Transformative AI')!;

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
        <CourseCard
          {...featuredCourse}
          cardType="Featured"
          className="h-full"
        />
      )}
    >
      {coursesWithUtm.filter((course) => course !== featuredCourse).map((course) => (
        <CourseCard key={course.title} {...course} />
      ))}
    </SlideList>
  );
};

export default CourseSection;
