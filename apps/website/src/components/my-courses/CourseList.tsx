import type { Course, CourseRegistration, Group } from '@bluedot/db';
import CourseListRow from './CourseListRow';

export type EnrichedCourse = {
  courseRegistration: CourseRegistration;
  course: Course;
  group: Group | null;
  facilitatorNames: string[];
};

type CourseListProps = {
  courses: EnrichedCourse[];
};

const CourseList = ({ courses }: CourseListProps) => {
  if (courses.length === 0) {
    return <p className="text-sm text-gray-500">No courses to show.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {courses.map(({ course, courseRegistration, group, facilitatorNames }) => (
        <CourseListRow
          key={courseRegistration.id}
          course={course}
          courseRegistration={courseRegistration}
          group={group}
          facilitatorNames={facilitatorNames}
        />
      ))}
    </div>
  );
};

export default CourseList;
