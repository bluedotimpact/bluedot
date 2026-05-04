import { useState } from 'react';
import BlueDotTabV2, { type CourseTab } from './BlueDotTabV2';
import CourseListV2 from './CourseListV2';
import MyBlueDotSidebarV2 from './MyBlueDotSidebarV2';
import NextDiscussionSectionV2 from './NextDiscussionSectionV2';

const CoursesPageV2 = () => {
  const [activeTab, setActiveTab] = useState<CourseTab>('in-progress');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-8">
        <MyBlueDotSidebarV2 />
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <NextDiscussionSectionV2 />
          <BlueDotTabV2 activeTab={activeTab} onTabChange={setActiveTab} />
          <CourseListV2 activeTab={activeTab} />
        </main>
      </div>
    </div>
  );
};

export default CoursesPageV2;
