import {
  render, screen, act, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  describe, expect, test, vi, beforeEach, afterEach,
} from 'vitest';
import { TRPCClientError } from '@trpc/client';
import { useAuthStore } from '@bluedot/ui';
import type { SyncStatus } from '@bluedot/db';
import SyncDashboard from '../../../pages/admin/sync-dashboard';
import { trpc } from '../../../utils/trpc';

// Mock dependencies
vi.mock('@bluedot/ui', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../utils/trpc', () => ({
  trpc: {
    admin: {
      syncHistory: {
        useQuery: vi.fn(),
      },
      requestSync: {
        useMutation: vi.fn(),
      },
    },
  },
}));

const mockedTrpc = vi.mocked(trpc, true);
const mockedUseAuthStore = vi.mocked(useAuthStore, true);

// Mock RiLoader4Line icon
vi.mock('react-icons/ri', () => ({
  RiLoader4Line: ({ className, size }: { className?: string; size?: number }) => (
    <div data-testid="loader-icon" className={className} style={{ width: size, height: size }} />
  ),
}));

describe('SyncDashboard - Main User Journeys', () => {
  const mockAuth = { token: 'test-token', email: 'test@bluedot.org', expiresAt: Date.now() + 3600000 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Default auth store state
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedUseAuthStore.mockImplementation((selector) => selector({ auth: mockAuth }));

    // Setup default mutation mock
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.requestSync.useMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });

    // Default query mock (will be overridden in individual tests)
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.syncHistory.useQuery.mockReturnValue({
      data: undefined,
      error: null,
      refetch: vi.fn(),
      isLoading: true,
      isFetching: false,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('denies access to unauthorized users', () => {
    // Mock tRPC error (403)
    const error = new TRPCClientError('Forbidden');
    Object.defineProperty(error, 'data', {
      value: { code: 'FORBIDDEN', httpStatus: 403 },
      writable: true,
    });

    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.syncHistory.useQuery.mockReturnValue({
      data: undefined,
      error,
      refetch: vi.fn(),
      isLoading: true,
      isFetching: false,
    });

    render(<SyncDashboard />);

    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access the admin dashboard.")).toBeInTheDocument();
  });

  test('shows login required message when user is logged out', () => {
    // Mock no auth (user logged out)
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedUseAuthStore.mockImplementation((selector) => selector({ auth: null }));

    // Mock tRPC error (401)
    const error = new TRPCClientError('Unauthorized');
    Object.defineProperty(error, 'data', {
      value: { code: 'UNAUTHORIZED', httpStatus: 401 },
      writable: true,
    });

    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.syncHistory.useQuery.mockReturnValue({
      data: undefined,
      error,
      refetch: vi.fn(),
      isLoading: false,
      isFetching: false,
    });

    render(<SyncDashboard />);

    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    expect(screen.getByText('You need to log in to access the admin dashboard.')).toBeInTheDocument();
    expect(screen.getByText('Log in with your BlueDot email address')).toBeInTheDocument();
  });

  test('authorized user can access dashboard and interact with sync button', async () => {
    // Use real timers for this test since it involves async mutations
    vi.useRealTimers();

    const user = userEvent.setup();
    const mockRefetch = vi.fn().mockResolvedValue(undefined);
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

    // Mock successful dashboard access with empty requests initially
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.syncHistory.useQuery.mockReturnValue({
      data: [],
      error: null,
      refetch: mockRefetch,
      isLoading: false,
      isFetching: false,
    });

    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.requestSync.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    render(<SyncDashboard />);

    expect(screen.getByRole('heading', { name: 'Sync Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('No manual sync requests in the last 24 hours')).toBeInTheDocument();

    // Find the sync button
    const syncButton = screen.getByRole('button', { name: 'Request Full Sync' });
    expect(syncButton).toBeInTheDocument();
    expect(syncButton).toBeEnabled();
    expect(syncButton).toHaveClass('bg-blue-600');

    // Click the button
    await act(async () => {
      await user.click(syncButton);
    });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockRefetch).toHaveBeenCalled();
    });

    // Restore fake timers for other tests
    vi.useFakeTimers();
  });

  test('displays different sync status states correctly', async () => {
    // Test queued, running, and completed states
    const requests = [
      {
        id: 1,
        status: 'queued' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: null,
        completedAt: null,
      },
      {
        id: 2,
        status: 'running' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: new Date('2023-01-01T10:01:00Z'),
        completedAt: null,
      },
      {
        id: 3,
        status: 'completed' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: new Date('2023-01-01T10:01:00Z'),
        completedAt: new Date('2023-01-01T10:05:00Z'),
      },
    ];

    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedTrpc.admin.syncHistory.useQuery.mockReturnValue({
      data: requests,
      error: null,
      refetch: vi.fn(),
      isLoading: false,
      isFetching: false,
    });

    await act(async () => {
      render(<SyncDashboard />);
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('queued')).toHaveClass('bg-gray-500');
    expect(screen.getByText('running')).toHaveClass('bg-yellow-500');
    expect(screen.getByText('completed')).toHaveClass('bg-green-500');

    // Should show warning message when sync is running
    expect(screen.getByText('A sync is currently running. Your request will be queued.')).toBeInTheDocument();
  });
});
