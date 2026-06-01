import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ApplicationRow from '../../components/facilitator-applications/ApplicationRow';
import {
  APPLICATION_TABS,
  filterByTab,
  getApplicationStatus,
  isApplicationTab,
  type ApplicationTab,
} from '../../components/facilitator-applications/applicationTabs';
import MyBlueDotLayout from '../../components/my-bluedot/MyBlueDotLayout';
import EmptyCourseList from '../../components/my-courses/EmptyCourseList';
import TabPills from '../../components/my-courses/TabPills';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.facilitatorApplications;

const EMPTY_BY_TAB: Record<ApplicationTab, { title: string; description: string }> = {
  active: {
    title: 'No active applications',
    description: 'Applications you submit will appear here.',
  },
  accepted: {
    title: 'No accepted applications',
    description: 'Accepted applications for upcoming rounds will appear here.',
  },
  pending: {
    title: 'No pending applications',
    description: 'Applications awaiting a decision will appear here.',
  },
  past: {
    title: 'No past applications',
    description: 'Applications for finished rounds will appear here.',
  },
};

const FacilitatorApplicationsPage = () => {
  const router = useRouter();
  const queryTab = router.query.tab;
  const activeTab: ApplicationTab = isApplicationTab(queryTab) ? queryTab : 'active';

  const setActiveTab = (id: ApplicationTab) => {
    router.replace({ pathname: router.pathname, query: { ...router.query, tab: id } }, undefined, { shallow: true });
  };

  const { data, isLoading, error } = trpc.facilitatorApplications.list.useQuery();

  const visible = data ? filterByTab(data, activeTab) : [];

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <MyBlueDotLayout route={CURRENT_ROUTE}>
        <div className="flex min-h-[60vh] flex-col gap-6">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <ProgressDots />
            </div>
          )}
          {error && <ErrorSection error={error} />}
          {!isLoading && !error && data && (
            <>
              <h2 className="text-size-md text-bluedot-black font-semibold">All applications</h2>
              <TabPills
                ariaLabel="Application filter"
                tabs={APPLICATION_TABS}
                value={activeTab}
                onChange={setActiveTab}
              />
              {visible.length === 0 ? (
                <EmptyCourseList {...EMPTY_BY_TAB[activeTab]} />
              ) : (
                <ul className="flex flex-col gap-3">
                  {visible.map((app) => {
                    const menuItems
                      = app.decision === 'Accept' && app.courseSlug
                        ? [
                          {
                            id: 'go-to-course',
                            label: 'Go to course',
                            href: `/courses/${app.courseSlug}`,
                          },
                        ]
                        : undefined;
                    return (
                      <ApplicationRow
                        key={app.id}
                        id={app.id}
                        courseTitle={app.courseTitle}
                        courseSlug={app.courseSlug}
                        roundName={app.roundName}
                        roundFirstDiscussionDate={app.roundFirstDiscussionDate}
                        roundLastDiscussionDate={app.roundLastDiscussionDate}
                        status={getApplicationStatus(app)}
                        menuItems={menuItems}
                      />
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default FacilitatorApplicationsPage;
