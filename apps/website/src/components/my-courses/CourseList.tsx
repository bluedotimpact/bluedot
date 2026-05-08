import { useState } from 'react';
import CourseListRow, { type CourseRowData } from './CourseListRow';

const COLLAPSED_LIMIT = 5;

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
  const [showAll, setShowAll] = useState(false);

  if (courses.length === 0) {
    return <p className="text-size-sm text-gray-500">{emptyMessage}</p>;
  }

  const visible = showAll ? courses : courses.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      {visible.map((c) => {
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
      {courses.length > COLLAPSED_LIMIT && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="cursor-pointer text-size-sm font-medium text-bluedot-normal transition-colors hover:text-blue-700"
            aria-expanded={showAll}
          >
            {showAll ? 'Show less' : `See all (${courses.length}) courses`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;
