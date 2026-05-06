import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../server/routers/_app';
import CourseListRow from './CourseListRow';

export type EnrichedCourse = inferRouterOutputs<AppRouter>['myCoursesPage']['getOverview']['courses'][number];

type CourseListProps = {
  courses: EnrichedCourse[];
  emptyMessage?: string;
};

const CourseList = ({ courses, emptyMessage = 'No courses to show.' }: CourseListProps) => {
  if (courses.length === 0) {
    return <p className="text-size-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {courses.map((c) => (
        <CourseListRow key={c.courseRegistration.id} course={c} />
      ))}
    </div>
  );
};

export default CourseList;
