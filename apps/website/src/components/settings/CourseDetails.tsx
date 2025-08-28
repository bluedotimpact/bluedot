import { useState } from 'react';
import { courseTable } from '@bluedot/db';

type CourseDetailsProps = {
  course: typeof courseTable.pg.$inferSelect;
  isLast?: boolean;
};

const CourseDetails = ({ course, isLast = false }: CourseDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>('upcoming');

  return (
    <div className={`bg-white border-x border-b border-gray-200 ${isLast ? 'rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
      <div>
        {/* Tab navigation */}
        <nav className="flex border-b border-gray-200" aria-label="Course content tabs">
          <div className="flex px-4 sm:px-8 gap-8">
            <button
              type="button"
              className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
              aria-current={activeTab === 'upcoming' ? 'page' : undefined}
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming discussions
            </button>
            <button
              type="button"
              className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'attended'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
              aria-current={activeTab === 'attended' ? 'page' : undefined}
              role="tab"
              aria-selected={activeTab === 'attended'}
              onClick={() => setActiveTab('attended')}
            >
              Attended discussions
            </button>
          </div>
        </nav>

        <div className="px-4 sm:px-8 py-6">
          {/* Tab content */}
          {activeTab === 'upcoming' && (
            <div className="min-h-[200px]">
              {/* Empty content for Upcoming discussions tab */}
            </div>
          )}
          {activeTab === 'attended' && (
            <div className="min-h-[200px]">
              {/* Empty content for Attended discussions tab */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
