import { useEffect, useState, useCallback } from 'react';
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import { RiLoader4Line } from 'react-icons/ri';
import type { SyncRequest, SyncStatus } from '@bluedot/db';

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

export default function SyncDashboard() {
  const [requests, setRequests] = useState<SyncRequest[]>([]);
  const [isSyncRequesting, setIsSyncRequesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const auth = useAuthStore((s) => s.auth);
  
  // Set up useAxios for fetching sync history
  const [{ data: syncData, loading: isInitialLoading, error: syncError }, fetchHistory] = useAxios<{ requests: SyncRequest[] }>(
    {
      method: 'get',
      url: '/api/admin/sync-history',
      headers: auth?.token ? {
        Authorization: `Bearer ${auth.token}`,
      } : undefined,
    },
    { manual: true }
  );

  // Set up useAxios for requesting sync
  const [, requestSyncAxios] = useAxios(
    {
      method: 'post',
      url: '/api/admin/request-sync',
      headers: auth?.token ? {
        Authorization: `Bearer ${auth.token}`,
      } : undefined,
    },
    { manual: true }
  );

  // Fetch data with proper refresh state management
  const fetchData = useCallback(async (isInitial = false) => {
    // Only show refresh indicator for subsequent loads when we have data
    if (!isInitial && hasInitiallyLoaded) {
      setIsRefreshing(true);
    }
    
    try {
      await fetchHistory();
    } catch (error) {
      // Error handling done in useEffect below
    } finally {
      if (!isInitial && hasInitiallyLoaded) {
        setIsRefreshing(false);
      }
    }
  }, [fetchHistory, hasInitiallyLoaded]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    if (auth) {
      fetchData(true);
      const interval = setInterval(() => {
        fetchData(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [auth, fetchData]);
  
  // Handle successful data updates
  useEffect(() => {
    if (syncData?.requests) {
      setRequests(syncData.requests);
      setHasAccess(true);
      setHasInitiallyLoaded(true);
    }
  }, [syncData]);

  // Handle errors (including 401/403 for access control)
  useEffect(() => {
    if (syncError) {
      setHasAccess(false);
      setHasInitiallyLoaded(true);
    }
  }, [syncError]);
  
  // Request a new sync
  const requestSync = async () => {
    if (!auth) return;
    
    setIsSyncRequesting(true);
    try {
      await requestSyncAxios();
      await fetchData(false);
    } catch (error) {
      console.error('Failed to request sync:', error);
    } finally {
      setIsSyncRequesting(false);
    }
  };
  
  // Access denied
  if (hasAccess === false) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.828 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
            </div>
          </div>
          <div className="text-red-700 space-y-4">
            <p>You don't have permission to access the admin dashboard.</p>
            
            <div>
              <p className="font-medium mb-2">To access the admin dashboard:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Confirm you're logged in with your BlueDot email address that's associated with the BlueDot Notion workspace</li>
                <li>If you believe you should have access but still see this message, please ask in the Slack channel</li>
              </ol>
            </div>
            
            <div className="pt-2 border-t border-red-200">
              <p className="text-sm">
                Only authorized team members with access to the BlueDot Notion workspace can use this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading only on initial load before any data is available
  if (!hasInitiallyLoaded && isInitialLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  // Check if sync is currently running
  const runningSyncs = requests.filter(r => r.status === 'running');
  const hasSyncRunning = runningSyncs.length > 0;
  
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Sync Dashboard</h1>
      
      
      {/* Single action button */}
      <div className="mb-8">
        <button 
          onClick={requestSync}
          disabled={isSyncRequesting}
          className={`px-6 py-3 rounded font-medium flex items-center gap-2 ${
            isSyncRequesting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSyncRequesting && <RiLoader4Line className="animate-spin" size={16} />}
          Request Full Sync
        </button>
        {hasSyncRunning && (
          <p className="mt-2 text-sm text-gray-600">
            A sync is currently running. Your request will be queued.
          </p>
        )}
      </div>
      
      {/* Important note about manual vs automatic syncs */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• This dashboard only shows manually requested syncs</li>
          <li>• Automatic syncs from schema changes are not displayed here</li>
          <li>• Check the Slack channel for sync start/stop updates</li>
          <li>• If syncs appear stuck, check #pg-sync-alerts Slack channel for pg-sync-service status</li>
        </ul>
      </div>
      
      {/* Recent activity (last 24 hours) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Manual Sync Requests (Last 24 Hours)
          {isRefreshing && (
            <RiLoader4Line className="animate-spin text-blue-600" size={16} />
          )}
        </h2>
        
        {requests.length === 0 ? (
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
              {requests.map(req => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <StatusBadge status={req.status} request={req} />
                  </td>
                  <td className="p-3">{req.requestedBy}</td>
                  <td className="p-3">
                    {formatTimeAgo(new Date(req.requestedAt))}
                  </td>
                  <td className="p-3">
                    {req.completedAt && req.startedAt
                      ? `${Math.round((new Date(req.completedAt).getTime() - new Date(req.startedAt).getTime()) / 60000)} min`
                      : req.status === 'running' 
                      ? (() => {
                          if (!req.startedAt) return 'Starting...';
                          const startTime = new Date(req.startedAt).getTime();
                          const now = new Date().getTime();
                          const minutesRunning = Math.round((now - startTime) / 60000);
                          return `${minutesRunning} min`;
                        })()
                      : 'Waiting'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, request }: { status: SyncStatus; request: SyncRequest }) {
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
}