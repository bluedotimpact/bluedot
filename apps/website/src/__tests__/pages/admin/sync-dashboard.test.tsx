import {
  render, screen, act, type RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  describe, expect, test, vi, beforeEach, afterEach, type Mock,
} from 'vitest';
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import type { SyncRequest, SyncStatus } from '@bluedot/db';
import SyncDashboard from '../../../pages/admin/sync-dashboard';

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

  test('authorized user can access dashboard and interact with sync button', async () => {
    const user = userEvent.setup({ delay: null });
    const mockFetchHistory = vi.fn().mockResolvedValue({ data: { requests: [] } });
    const mockRequestSync = vi.fn().mockResolvedValue({ data: { success: true, requestId: 1 } });

    // Mock successful dashboard access with empty requests initially  
    mockedUseAxios
      .mockReturnValueOnce([{ 
        data: { requests: [] }, 
        loading: false, 
        error: null 
      }, mockFetchHistory])
      .mockReturnValueOnce([{ 
        data: null, 
        loading: false, 
        error: null 
      }, mockRequestSync]);
    
    let component: RenderResult;
    await act(async () => {
      component = render(<SyncDashboard />);
      // Advance timers to handle any initial effects
      vi.advanceTimersByTime(100);
    });
    
    expect(screen.getByRole('heading', { name: 'Sync Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('No manual sync requests in the last 24 hours')).toBeInTheDocument();
    
    // Find the sync button
    const syncButton = screen.getByRole('button', { name: 'Request Full Sync' });
    expect(syncButton).toBeInTheDocument();
    expect(syncButton).toBeEnabled();
    expect(syncButton).toHaveClass('bg-blue-600');
    
    // Setup mock for after sync request - should return a new request
    const newRequest = {
      id: 1,
      status: 'queued' as SyncStatus,
      requestedBy: 'test@bluedot.org',
      requestedAt: new Date('2023-01-01T10:00:00Z'),
      startedAt: null,
      completedAt: null
    };
    
    // Mock the refetch to return new data after sync request
    mockFetchHistory.mockResolvedValueOnce({ data: { requests: [newRequest] } });
    
    // Click the button
    await act(async () => {
      await user.click(syncButton);
      vi.advanceTimersByTime(100);
    });
    
    // Mock the component re-render with new data
    mockedUseAxios
      .mockReturnValueOnce([{ 
        data: { requests: [newRequest] }, 
        loading: false, 
        error: null 
      }, mockFetchHistory])
      .mockReturnValueOnce([{ 
        data: null, 
        loading: false, 
        error: null 
      }, mockRequestSync]);
    
    // Re-render to simulate the effect of fetchHistory updating the data
    await act(async () => {
      component.rerender(<SyncDashboard />);
      vi.advanceTimersByTime(100);
    });
    
    // Verify the empty state is gone
    expect(screen.queryByText('No manual sync requests in the last 24 hours')).not.toBeInTheDocument();
    
    // Verify the actual request data is displayed
    expect(screen.getByText('queued')).toBeInTheDocument();
    expect(screen.getByText('test@bluedot.org')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument(); // Run time column shows "Waiting" for queued status
  });

  test('displays different sync status states correctly', async () => {
    const mockRefetch = vi.fn();
    
    // Test queued, running, and completed states
    const requests = [
      { 
        id: 1, 
        status: 'queued' as SyncStatus, 
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: null,
        completedAt: null
      },
      {
        id: 2, 
        status: 'running' as SyncStatus, 
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: new Date('2023-01-01T10:01:00Z'),
        completedAt: null
      },
      { 
        id: 3, 
        status: 'completed' as SyncStatus, 
        requestedBy: 'test@bluedot.org',
        requestedAt: new Date('2023-01-01T10:00:00Z'),
        startedAt: new Date('2023-01-01T10:01:00Z'),
        completedAt: new Date('2023-01-01T10:05:00Z')
      },
    ];

    mockedUseAxios
      .mockReturnValueOnce([{ 
        data: { requests }, 
        loading: false, 
        error: null 
      }, mockRefetch])
      .mockReturnValueOnce([{ 
        data: null, 
        loading: false, 
        error: null 
      }, vi.fn()]);

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
