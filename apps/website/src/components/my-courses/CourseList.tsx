import CourseListRow, { type CourseListRowProps } from './CourseListRow';

type CourseListProps = {
  courses: CourseListRowProps[];
  emptyMessage?: string;
};

const CourseList = ({ courses, emptyMessage = 'No courses to show.' }: CourseListProps) => {
  if (courses.length === 0) {
    return <p className="text-size-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {courses.map((c) => (
        <CourseListRow key={c.courseRegistration.id} {...c} />
      ))}
      {/* TODO add "show all" */}
    </div>
  );
};

export default CourseList;
