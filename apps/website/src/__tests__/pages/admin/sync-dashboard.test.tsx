import '@testing-library/jest-dom';
import {
  render, screen, act, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TRPCError } from '@trpc/server';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { useAuthStore } from '@bluedot/ui';
import type { SyncStatus } from '@bluedot/db';
import { server, trpcMsw } from '../../trpcMswSetup';
import { TrpcProvider } from '../../trpcProvider';
import SyncDashboard from '../../../pages/admin/sync-dashboard';

// Mock dependencies
vi.mock('@bluedot/ui', () => ({
  useAuthStore: vi.fn(),
}));

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

    // Default auth store state
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedUseAuthStore.mockImplementation((selector) => selector({ auth: mockAuth }));
  });

  test('denies access to unauthorized users', async () => {
    server.use(trpcMsw.admin.syncHistory.query(() => {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Forbidden' });
    }));

    render(<SyncDashboard />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    });
    expect(screen.getByText('You don\'t have permission to access the admin dashboard.')).toBeInTheDocument();
  });

  test('shows login required message when user is logged out', async () => {
    // Mock no auth (user logged out)
    // @ts-expect-error - Mocking only the subset of properties needed for test
    mockedUseAuthStore.mockImplementation((selector) => selector({ auth: null }));

    server.use(trpcMsw.admin.syncHistory.query(() => {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }));

    render(<SyncDashboard />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    });
    expect(screen.getByText('You need to log in to access the admin dashboard.')).toBeInTheDocument();
    expect(screen.getByText('Log in with your BlueDot email address')).toBeInTheDocument();
  });

  test('authorized user can access dashboard and interact with sync button', async () => {
    const user = userEvent.setup();

    server.use(
      trpcMsw.admin.syncHistory.query(() => []),
      trpcMsw.admin.requestSync.mutation(() => ({ requestId: 1 })),
    );

    render(<SyncDashboard />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sync Dashboard' })).toBeInTheDocument();
    });
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
      expect(syncButton).toBeEnabled();
    });
  });

  test('displays different sync status states correctly', async () => {
    // Test queued, running, and completed states
    const requests = [
      {
        id: 1,
        status: 'queued' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: '2023-01-01T10:00:00Z',
        startedAt: null,
        completedAt: null,
      },
      {
        id: 2,
        status: 'running' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: '2023-01-01T10:00:00Z',
        startedAt: '2023-01-01T10:01:00Z',
        completedAt: null,
      },
      {
        id: 3,
        status: 'completed' as SyncStatus,
        requestedBy: 'test@bluedot.org',
        requestedAt: '2023-01-01T10:00:00Z',
        startedAt: '2023-01-01T10:01:00Z',
        completedAt: '2023-01-01T10:05:00Z',
      },
    ];

    server.use(trpcMsw.admin.syncHistory.query(() => requests));

    render(<SyncDashboard />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByText('queued')).toHaveClass('bg-gray-500');
    expect(screen.getByText('running')).toHaveClass('bg-yellow-500');
    expect(screen.getByText('completed')).toHaveClass('bg-green-500');

    // Should show warning message when sync is running
    expect(screen.getByText('A sync is currently running. Your request will be queued.')).toBeInTheDocument();
  });
});
