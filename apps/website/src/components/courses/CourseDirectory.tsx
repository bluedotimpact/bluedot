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
  displayData: GetCoursesResponse | undefined;
  displayLoading: boolean;
};

const CourseDirectory: FC<CourseDirectoryProps> = ({
  displayData,
  displayLoading,
}) => {
  return (
    <Section className="course-directory">
      <div className="course-directory__content flex flex-col gap-spacing-x">
        <div className="course-directory__results-section flex flex-col gap-4 mt-2">
          {displayLoading && <ProgressDots />}
          <div className="course-directory__results grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {displayData?.courses
              && displayData.courses.length > 0
              && displayData.courses.map((course) => (
                <CourseSearchCard
                  key={course.title || course.id}
                  description={course.description || ''}
                  cadence={course.cadence || ''}
                  level=""
                  averageRating={0}
                  imageSrc=""
                  title={course.title || ''}
                  url={course.path || ''}
                />
              ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default CourseDirectory;
