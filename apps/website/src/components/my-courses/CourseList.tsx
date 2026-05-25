import CourseListRow, { type CourseListRowProps } from './CourseListRow';

type CourseListProps = {
  courses: CourseListRowProps[];
  expandedById?: Record<string, boolean>;
  onToggleExpand?: (id: string) => void;
};

export const courseListRowKey = (c: CourseListRowProps): string =>
  `${c.courseRegistration.id}:${c.group?.id ?? ''}`;

const CourseList = ({
  courses,
  expandedById = {},
  onToggleExpand,
}: CourseListProps) => (
  <div className="flex flex-col gap-6">
    {courses.map((c) => {
      const id = courseListRowKey(c);
      return (
        <CourseListRow
          key={id}
          {...c}
          isExpanded={expandedById[id] ?? false}
          onToggleExpand={() => onToggleExpand?.(id)}
        />
      );
    })}
  </div>
);

export default CourseList;
