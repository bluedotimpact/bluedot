import {
  FC,
} from 'react';
import {
  Section,
  ProgressDots,
} from '@bluedot/ui';
import type { GetCoursesResponse } from '../../pages/api/courses';
import { CourseSearchCard } from './CourseSearchCard';

export type CourseDirectoryProps = {
  courses: GetCoursesResponse['courses'] | undefined;
  loading: boolean;
};

const CourseDirectory: FC<CourseDirectoryProps> = ({
  courses,
  loading,
}) => {
  return (
    <Section className="course-directory">
      <div className="course-directory__content flex flex-col gap-spacing-x">
        <div className="course-directory__results-section flex flex-col gap-4 mt-2">
          {loading && <ProgressDots />}
          <div className="course-directory__results grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {courses
              && courses.length > 0
              && courses.map((course) => (
                <CourseSearchCard
                  key={course.id}
                  title={course.title || ''}
                  description={course.shortDescription || ''}
                  cadence={course.cadence || ''}
                  courseLength={course.durationDescription || ''}
                  imageSrc={course.image || undefined}
                  url={course.path || '#'}
                />
              ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default CourseDirectory;
