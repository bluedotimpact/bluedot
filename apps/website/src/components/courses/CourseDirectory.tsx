import {
  ProgressDots,
  Section,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import {
  FC,
} from 'react';
import type { AppRouter } from '../../server/routers/_app';
import { usePrimaryCourseURL } from '../../lib/hooks/usePrimaryCourseURL';
import { CourseSearchCard } from './CourseSearchCard';

export type CourseDirectoryProps = {
  courses?: inferRouterOutputs<AppRouter>['courses']['getAll'];
  loading: boolean;
};

const CourseDirectory: FC<CourseDirectoryProps> = ({
  courses,
  loading,
}) => {
  const { getPrimaryCourseURL } = usePrimaryCourseURL();

  return (
    <Section>
      <div className="flex flex-col gap-spacing-x">
        <div className="flex flex-col gap-4 mt-2">
          {loading && <ProgressDots />}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {courses
              && courses.length > 0
              && courses.map((course) => (
                <CourseSearchCard
                  key={course.id}
                  title={course.title}
                  description={course.shortDescription}
                  imageSrc={course.image || undefined}
                  url={getPrimaryCourseURL(course.slug)}
                />
              ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default CourseDirectory;
