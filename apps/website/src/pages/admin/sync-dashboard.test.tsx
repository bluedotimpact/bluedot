import {
  render, screen,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, expect, test, vi, beforeEach, afterEach, type Mock,
} from 'vitest';
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import type { SyncRequest, SyncStatus } from '@bluedot/db';
import SyncDashboard from './sync-dashboard';

// Mock dependencies
vi.mock('axios-hooks');
vi.mock('@bluedot/ui', () => ({
  useAuthStore: vi.fn(),
}));

const mockedUseAxios = useAxios as unknown as Mock;
const mockedUseAuthStore = useAuthStore as unknown as Mock;

// Mock RiLoader4Line icon
vi.mock('react-icons/ri', () => ({
  RiLoader4Line: ({ className, size }: { className?: string; size?: number }) => (
    <div data-testid="loader-icon" className={className} style={{ width: size, height: size }} />
  ),
}));

describe('SyncDashboard - Main User Journeys', () => {
  const mockAuth = { token: 'test-token', email: 'test@bluedot.org' };
  const mockSyncRequest: SyncRequest = {
    id: 1,
    requestedBy: 'test@bluedot.org',
    status: 'completed' as SyncStatus,
    requestedAt: new Date('2023-01-01T10:00:00Z'),
    startedAt: new Date('2023-01-01T10:01:00Z'),
    completedAt: new Date('2023-01-01T10:05:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Default auth store state
    mockedUseAuthStore.mockImplementation((selector) => {
      const state = { auth: mockAuth };
      return selector(state);
    });

    // Default useAxios mock (will be overridden in individual tests)
    mockedUseAxios.mockReturnValue([
      { data: null, loading: false, error: null },
      vi.fn(),
    ]);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('denies access to unauthorized users', () => {
    // Mock API error (403) - component shows access denied when there's an error
    const mockError = { response: { status: 403 } };

    mockedUseAxios
      .mockReturnValueOnce([
        { data: null, loading: false, error: mockError },
        vi.fn(),
      ])
      .mockReturnValueOnce([
        { data: null, loading: false, error: null },
        vi.fn(),
      ]);

    render(<SyncDashboard />);

    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access the admin dashboard.")).toBeInTheDocument();
  });

  test('allows authorized users to view dashboard and request syncs', () => {
    // Mock successful data load
    mockedUseAxios
      .mockReturnValueOnce([
        { data: { requests: [] }, loading: false, error: null },
        vi.fn(),
      ])
      .mockReturnValueOnce([
        { data: null, loading: false, error: null },
        vi.fn(),
      ]);

    render(<SyncDashboard />);

    expect(screen.getByRole('heading', { name: 'Sync Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Full Sync' })).toBeInTheDocument();
    expect(screen.getByText('No manual sync requests in the last 24 hours')).toBeInTheDocument();
  });

  test('displays sync status with different states', () => {
    const requests = [
      { ...mockSyncRequest, id: 1, status: 'queued' as SyncStatus },
      {
        ...mockSyncRequest, id: 2, status: 'running' as SyncStatus, completedAt: null,
      },
      { ...mockSyncRequest, id: 3, status: 'completed' as SyncStatus },
    ];

    mockedUseAxios
      .mockReturnValueOnce([
        { data: { requests }, loading: false, error: null },
        vi.fn(),
      ])
      .mockReturnValueOnce([
        { data: null, loading: false, error: null },
        vi.fn(),
      ]);

    render(<SyncDashboard />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('queued')).toHaveClass('bg-gray-500');
    expect(screen.getByText('running')).toHaveClass('bg-yellow-500');
    expect(screen.getByText('completed')).toHaveClass('bg-green-500');
  });

  test('shows running sync message and allows queueing', () => {
    const runningSync = {
      ...mockSyncRequest,
      status: 'running' as SyncStatus,
      completedAt: null,
    };

    mockedUseAxios
      .mockReturnValueOnce([
        { data: { requests: [runningSync] }, loading: false, error: null },
        vi.fn(),
      ])
      .mockReturnValueOnce([
        { data: null, loading: false, error: null },
        vi.fn(),
      ]);

    render(<SyncDashboard />);

    expect(screen.getByText('A sync is currently running. Your request will be queued.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Full Sync' })).toBeEnabled();
  });

  test('displays sync data and handles updates', () => {
    // Test that component properly displays sync data when available
    mockedUseAxios
      .mockReturnValueOnce([
        { data: { requests: [mockSyncRequest] }, loading: false, error: null },
        vi.fn(),
      ])
      .mockReturnValueOnce([
        { data: null, loading: false, error: null },
        vi.fn(),
      ]);

    render(<SyncDashboard />);

    // Should display the sync data properly
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('test@bluedot.org')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sync Dashboard' })).toBeInTheDocument();
  });
});
