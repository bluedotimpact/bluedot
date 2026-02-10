import type { SyncStatus } from '@bluedot/db';
import { useAuthStore } from '@bluedot/ui';
import { RiLoader4Line } from 'react-icons/ri';
import { trpc } from '../../utils/trpc';

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
      <div className="p-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="size-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.828 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-size-lg font-medium text-red-800">Access Denied</h3>
            </div>
          </div>
          <div className="text-red-700 space-y-4">
            <p>
              {auth
                ? 'You don\'t have permission to access the admin dashboard.'
                : 'You need to log in to access the admin dashboard.'}
            </p>

            <div>
              <p className="font-medium mb-2">To access the admin dashboard:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                {!auth && <li>Log in with your BlueDot email address</li>}
                <li>Confirm you're logged in with your BlueDot email address that's associated with the BlueDot Notion workspace</li>
                <li>If you believe you should have access but still see this message, please ask in the Slack channel</li>
              </ol>
            </div>

            <div className="pt-2 border-t border-red-200">
              <p className="text-size-sm">
                Only authorized team members with access to the BlueDot Notion workspace can use this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show general error (network, server errors, etc.)
  if (hasGeneralError) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="size-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-size-lg font-medium text-amber-800">Connection Error</h3>
            </div>
          </div>
          <div className="text-amber-700 space-y-4">
            <p>Unable to load sync dashboard. Please check your connection and try again.</p>
            <div className="pt-2 border-t border-amber-200">
              <p className="text-size-sm">
                If this problem persists, please check Slack to see if there was an ongoing issue
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading until we have determined access (either success or error response from API)
  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Check if sync is currently running
  const hasSyncRunning = (syncData || []).some((r) => r.status === 'running');

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Sync Dashboard</h1>

      {/* Single action button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={requestSync}
          disabled={requestTrpcSync.isPending}
          className={`px-6 py-3 rounded font-medium flex items-center gap-2 ${
            requestTrpcSync.isPending
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {requestTrpcSync.isPending && <RiLoader4Line className="animate-spin" size={16} />}
          Request Full Sync
        </button>
        {hasSyncRunning && (
          <p className="mt-2 text-size-sm text-gray-600">
            A sync is currently running. Your request will be queued.
          </p>
        )}
      </div>

      {/* Important note about manual vs automatic syncs */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-size-sm text-blue-800 space-y-1">
          <li>• This dashboard only shows manually requested syncs</li>
          <li>• Automatic syncs from schema changes are not displayed here</li>
          <li>• Check the Slack channel for sync start/stop updates</li>
          <li>• If syncs appear stuck, check #pg-sync-alerts Slack channel for pg-sync-service status</li>
        </ul>
      </div>

      {/* Recent activity (last 24 hours) */}
      <div>
        <h2 className="text-size-xl font-semibold mb-4 flex items-center gap-2">
          Manual Sync Requests (Last 24 Hours)
          {isFetching && (
            <RiLoader4Line className="animate-spin text-blue-600" size={16} />
          )}
        </h2>

        {!syncData || syncData.length === 0 ? (
          <p className="text-gray-600">No manual sync requests in the last 24 hours</p>
        ) : (
          <table className="w-full border rounded">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Requested By</th>
                <th className="p-3 text-left">Requested</th>
                <th className="p-3 text-left">Run Time</th>
              </tr>
            </thead>
            <tbody>
              {syncData?.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
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
        )}
      </div>
    </div>
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

export default SyncDashboard;
