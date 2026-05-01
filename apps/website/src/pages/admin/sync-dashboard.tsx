import type { SyncStatus } from '@bluedot/db';
import {
  Breadcrumbs,
  CTALinkOrButton,
  H3,
  P,
  ProgressDots,
  Section,
  useAuthStore,
} from '@bluedot/ui';
import Head from 'next/head';
import { RiLoader4Line } from 'react-icons/ri';
import MarketingHero from '../../components/MarketingHero';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import { WarningCircleIcon, WarningTriangleIcon } from '../../components/icons';

const CURRENT_ROUTE = ROUTES.adminSyncDashboard;
const HERO_SUBTITLE = 'Trigger a manual database sync and review the most recent activity.';

// Time formatter for 24-hour data
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'less than a minute ago';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
}

const PageChrome = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Head>
      <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      <meta name="robots" content="noindex" />
    </Head>
    <MarketingHero title={CURRENT_ROUTE.title} subtitle={HERO_SUBTITLE} />
    <Breadcrumbs route={CURRENT_ROUTE} />
    {children}
  </div>
);

const SyncDashboard = () => {
  const auth = useAuthStore((s) => s.auth);

  const {
    data: syncData,
    error: syncError,
    refetch: fetchHistory,
    isLoading,
    isFetching,
  } = trpc.admin.syncHistory.useQuery(undefined, {
    // Don't refetch if unauthorized or forbidden
    refetchInterval: (query) => (query?.state?.error?.data?.code === 'UNAUTHORIZED' || query?.state?.error?.data?.code === 'FORBIDDEN'
      ? false
      : 5000),
  });

  const requestTrpcSync = trpc.admin.requestSync.useMutation();

  const hasAuthError = syncError?.data?.code === 'UNAUTHORIZED' || syncError?.data?.code === 'FORBIDDEN';
  const hasGeneralError = syncError && !hasAuthError;

  // Request a new sync
  const requestSync = async () => {
    try {
      await requestTrpcSync.mutateAsync();
      await fetchHistory();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to request sync:', error);
    }
  };

  // Access denied
  if (hasAuthError) {
    return (
      <PageChrome>
        <Section className="max-w-3xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <WarningTriangleIcon size={32} className="text-red-600" />
              </div>
              <div className="ml-3">
                <H3 className="text-red-800">Access Denied</H3>
              </div>
            </div>
            <div className="text-red-700 space-y-4">
              <P className="text-red-700">
                {auth
                  ? 'You don\'t have permission to access the admin dashboard.'
                  : 'You need to log in to access the admin dashboard.'}
              </P>

              <div>
                <P className="font-semibold text-red-800 mb-2">To access the admin dashboard:</P>
                <ol className="list-decimal list-inside space-y-2 ml-4 text-red-700">
                  {!auth && <li>Log in with your BlueDot email address</li>}
                  <li>Confirm you're logged in with your BlueDot email address that's associated with the BlueDot Notion workspace</li>
                  <li>If you believe you should have access but still see this message, please ask in the Slack channel</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-red-200">
                <P className="text-size-sm text-red-700">
                  Only authorized team members with access to the BlueDot Notion workspace can use this dashboard.
                </P>
              </div>
            </div>
          </div>
        </Section>
      </PageChrome>
    );
  }

  // Show general error (network, server errors, etc.)
  if (hasGeneralError) {
    return (
      <PageChrome>
        <Section className="max-w-3xl">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <WarningCircleIcon size={32} className="text-amber-600" />
              </div>
              <div className="ml-3">
                <H3 className="text-amber-800">Connection Error</H3>
              </div>
            </div>
            <div className="text-amber-700 space-y-4">
              <P className="text-amber-700">Unable to load sync dashboard. Please check your connection and try again.</P>
              <div className="pt-2 border-t border-amber-200">
                <P className="text-size-sm text-amber-700">
                  If this problem persists, please check Slack to see if there was an ongoing issue
                </P>
              </div>
            </div>
          </div>
        </Section>
      </PageChrome>
    );
  }

  // Show loading until we have determined access (either success or error response from API)
  if (isLoading) {
    return (
      <PageChrome>
        <ProgressDots className="py-8" />
      </PageChrome>
    );
  }

  // Check if sync is currently running
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const hasSyncRunning = (syncData || []).some((r) => r.status === 'running');

  return (
    <PageChrome>
      <Section className="max-w-3xl">
        {/* Single action button */}
        <div className="mb-8">
          <CTALinkOrButton
            variant="primary"
            onClick={requestSync}
            disabled={requestTrpcSync.isPending}
          >
            {requestTrpcSync.isPending && <RiLoader4Line className="animate-spin mr-2" size={16} />}
            Request Full Sync
          </CTALinkOrButton>
          {hasSyncRunning && (
            <P className="mt-2 text-size-sm text-gray-600">
              A sync is currently running. Your request will be queued.
            </P>
          )}
        </div>

        {/* Important note about manual vs automatic syncs */}
        <div className="container-lined mb-8 p-4 bg-blue-50 border-blue-200">
          <P className="font-semibold text-blue-900 mb-2">Important notes</P>
          <ul className="text-size-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>This dashboard only shows manually requested syncs</li>
            <li>Automatic syncs from schema changes are not displayed here</li>
            <li>Check the Slack channel for sync start/stop updates</li>
            <li>If syncs appear stuck, check #pg-sync-alerts Slack channel for pg-sync-service status</li>
          </ul>
        </div>

        {/* Recent activity (last 24 hours) */}
        <div>
          <H3 className="mb-4 flex items-center gap-2">
            Manual sync requests (last 24 hours)
            {isFetching && (
              <RiLoader4Line className="animate-spin text-bluedot-normal" size={16} />
            )}
          </H3>

          {!syncData || syncData.length === 0 ? (
            <P className="text-gray-600">No manual sync requests in the last 24 hours</P>
          ) : (
            <div className="container-lined overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-color-canvas border-b border-color-divider">
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Requested By</th>
                    <th className="p-3 text-left">Requested</th>
                    <th className="p-3 text-left">Run Time</th>
                  </tr>
                </thead>
                <tbody>
                  {syncData?.map((req) => (
                    <tr key={req.id} className="border-b border-color-divider last:border-b-0 hover:bg-color-canvas">
                      <td className="p-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="p-3">{req.requestedBy}</td>
                      <td className="p-3">
                        {formatTimeAgo(new Date(req.requestedAt))}
                      </td>
                      <td className="p-3">
                        {(() => {
                          if (req.completedAt && req.startedAt) {
                            return `${Math.round((new Date(req.completedAt).getTime() - new Date(req.startedAt).getTime()) / 60000)} min`;
                          }

                          if (req.status === 'running') {
                            if (!req.startedAt) {
                              return 'Starting...';
                            }

                            const startTime = new Date(req.startedAt).getTime();
                            const now = new Date().getTime();
                            const minutesRunning = Math.round((now - startTime) / 60000);
                            return `${minutesRunning} min`;
                          }

                          return 'Waiting';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    </PageChrome>
  );
};

const StatusBadge = ({ status }: { status: SyncStatus }) => {
  const colors = {
    queued: 'bg-gray-500',
    running: 'bg-yellow-500',
    completed: 'bg-green-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-white text-sm ${colors[status]}`}>
      {status}
    </span>
  );
};

SyncDashboard.pageRendersOwnNav = true;
SyncDashboard.mainShrinkToContent = true;

export default SyncDashboard;
