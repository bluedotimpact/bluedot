import Head from 'next/head';
import { useState } from 'react';
import MyBlueDotLayout from '../components/MyBlueDotLayout';
import CourseList from '../components/my-courses/CourseList';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import TabPill from '../components/my-courses/TabPill';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.myCourses;

type CourseTab = 'in-progress' | 'upcoming' | 'past-courses';

const TABS: { id: CourseTab; label: string }[] = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
];

const MyCoursesPage = () => {
  const [activeTab, setActiveTab] = useState<CourseTab>('in-progress');

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <MyBlueDotLayout route={CURRENT_ROUTE}>
        <div className="flex flex-col gap-6 p-4">
          <NextDiscussionCard />
          <TabPills ariaLabel="Course filter">
            {TABS.map((tab) => (
              <TabPill
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabPill>
            ))}
          </TabPills>
          <CourseList />
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default MyCoursesPage;
