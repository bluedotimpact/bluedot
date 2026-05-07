import CourseListRow, { type CourseRowData } from './CourseListRow';

type CourseListProps = {
  courses: CourseRowData[];
  emptyMessage?: string;
  expandedById?: Record<string, boolean>;
  onToggleExpand?: (id: string) => void;
};

const CourseList = ({
  courses,
  emptyMessage = 'No courses to show.',
  expandedById = {},
  onToggleExpand,
}: CourseListProps) => {
  if (courses.length === 0) {
    return <p className="text-size-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {courses.map((c) => {
        const { id } = c.courseRegistration;
        return (
          <CourseListRow
            key={id}
            {...c}
            isExpanded={expandedById[id] ?? false}
            onToggleExpand={() => onToggleExpand?.(id)}
          />
        );
      })}
      {/* TODO add "show all" */}
    </div>
  );
};

export default CourseList;
