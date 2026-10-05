import type { SyncStatus } from '@bluedot/db';
import {
  Breadcrumbs,
  Callout,
  CTALinkOrButton,
  H3,
  P,
  ProgressDots,
  Section,
  useAuthStore,
} from '@bluedot/ui';
import Head from 'next/head';
import { FaCircleNotch } from 'react-icons/fa6';
import MarketingHero from '../../components/MarketingHero';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import { pageMetaTags } from '../../lib/linkPreviewMetaTags';

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
      {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact` })}
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
          <Callout tone="error" title="Access Denied">
            <p>
              {auth
                ? 'You don\'t have permission to access the admin dashboard.'
                : 'You need to log in to access the admin dashboard.'}
            </p>
            <div>
              <p className="font-semibold">To access the admin dashboard:</p>
              <ol className="list-decimal list-inside ml-4">
                {!auth && <li>Log in with your BlueDot email address</li>}
                <li>Confirm you're logged in with your BlueDot email address that's associated with the BlueDot Notion workspace</li>
                <li>If you believe you should have access but still see this message, please ask in the Slack channel</li>
              </ol>
            </div>
            <p>Only authorized team members with access to the BlueDot Notion workspace can use this dashboard.</p>
          </Callout>
        </Section>
      </PageChrome>
    );
  }

  // Show general error (network, server errors, etc.)
  if (hasGeneralError) {
    return (
      <PageChrome>
        <Section className="max-w-3xl">
          <Callout tone="warning" title="Connection Error">
            <p>Unable to load sync dashboard. Please check your connection and try again.</p>
            <p>If this problem persists, please check Slack to see if there was an ongoing issue</p>
          </Callout>
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
            {requestTrpcSync.isPending && <FaCircleNotch aria-hidden="true" className="size-3 animate-spin mr-2" />}
            Request Full Sync
          </CTALinkOrButton>
          {hasSyncRunning && (
            <P className="mt-2 text-size-sm text-gray-600">
              A sync is currently running. Your request will be queued.
            </P>
          )}
        </div>

        {/* Important note about manual vs automatic syncs */}
        <Callout title="Important notes" className="mb-8">
          <ul className="list-disc list-inside">
            <li>Syncs that pg-sync-service starts itself (e.g. after a schema change) are listed here as requested by pg-sync-service</li>
            <li>Check the Slack channel for sync start/stop updates</li>
            <li>If syncs appear stuck, check #pg-sync-alerts Slack channel for pg-sync-service status</li>
          </ul>
        </Callout>

        {/* Recent activity (last 24 hours) */}
        <div>
          <H3 className="mb-4 flex items-center gap-2">
            Sync requests (last 24 hours)
            {isFetching && (
              <FaCircleNotch aria-hidden="true" className="size-3 animate-spin text-bluedot-normal" />
            )}
          </H3>

          {!syncData || syncData.length === 0 ? (
            <P className="text-gray-600">No sync requests in the last 24 hours</P>
          ) : (
            <div className="container-lined overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-canvas border-b border-default">
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Requested By</th>
                    <th className="p-3 text-left">Requested</th>
                    <th className="p-3 text-left">Run Time</th>
                  </tr>
                </thead>
                <tbody>
                  {syncData?.map((req) => (
                    <tr key={req.id} className="border-b border-default last:border-b-0 hover:bg-canvas">
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
    failed: 'bg-red-500',
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
