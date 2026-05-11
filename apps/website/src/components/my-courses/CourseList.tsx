import { useState } from 'react';
import CourseListRow, { type CourseRowData } from './CourseListRow';

// TODO I think this changed from the legacy version, also there are some unnecessary variable name changes
// (e.g. SEE_ALL_THRESHOLD -> COLLAPSED_LIMIT). Make it more similar to the legacy unless there is a reason to change
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
            // TODO fix this prop drilling for expanded/collapsed
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
