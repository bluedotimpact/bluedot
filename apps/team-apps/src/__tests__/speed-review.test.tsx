import {
  act, cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';
import type { Application } from '../lib/client/types';
import { useNavigationState } from '../lib/client/navigation';

const { response, testRound } = vi.hoisted(() => ({
  response: { applications: [] as Application[] },
  testRound: { name: 'AGI Strategy (test)' },
}));
vi.mock('axios-hooks', () => ({ default: () => [{ data: response, loading: false, error: null }] }));
vi.mock('../lib/client/api', () => ({ authFetch: vi.fn() }));
vi.mock('@bluedot/ui', () => ({
  H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  H2: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  ProgressDots: () => <span>Loading</span>,
}));
vi.mock('../components/RoundPicker', () => ({
  RoundPicker: ({ onSelect }: { onSelect: (round: { id: string; name: string; course: string }, direction: string) => void }) => <button type="button" onClick={() => onSelect({ id: 'recTestRound', name: testRound.name, course: testRound.name.split('(')[0]!.trim() }, 'top')}>Start test round</button>,
}));
vi.mock('../components/ApplicationCard', () => ({ ApplicationCard: ({ application }: { application: Application }) => <p>{application.name}</p> }));
vi.mock('../components/MoveToAgiscControl', () => ({
  MoveToAgiscControl: ({ onMoved }: { onMoved: (roundName: string) => void }) => <button type="button" onClick={() => onMoved('AGI Strategy (target)')}>Move to AGI Strategy</button>,
}));

import { authFetch } from '../lib/client/api';
import SpeedReviewPage from '../pages/speed-review';

beforeEach(() => {
  vi.useFakeTimers();
  testRound.name = 'AGI Strategy (test)';
  useNavigationState.setState({ sessionActive: false, pendingWrites: 0, promptOpen: false });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const expire = () => {
  act(() => vi.advanceTimersByTime(30_000));
  act(() => vi.advanceTimersByTime(1));
};

test('expiry rotates to the next application and restarts its timer', () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  expire();
  expect(screen.getByText('Second test applicant')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Pause timer' }).textContent).toContain('30s');
});

test('tapping a rating button saves the decision and advances the queue', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  vi.mocked(authFetch).mockResolvedValue({ ok: true } as Response);
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  expect(authFetch).toHaveBeenCalledWith('/api/decisions', expect.objectContaining({
    method: 'POST',
    body: expect.stringContaining('"id":"recOne"'),
  }));
  expect(screen.getByText('Second test applicant')).toBeTruthy();
});

test('moving to AGI Strategy shows an undo toast that reverses the move', async () => {
  testRound.name = 'Technical AI Safety (test)';
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  vi.mocked(authFetch).mockResolvedValue({ ok: true } as Response);
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Move to AGI Strategy' }));
  });
  expect(screen.getByText('Second test applicant')).toBeTruthy();
  expect(screen.getByText('Moved First test applicant')).toBeTruthy();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Undo move' }));
  });
  expect(authFetch).toHaveBeenCalledWith('/api/undo-move-to-agisc', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ applicationId: 'recOne', roundId: 'recTestRound' }),
  }));
  expect(screen.getByText('First test applicant')).toBeTruthy();
});

test('a failed undo keeps the application moved and offers a retry', async () => {
  testRound.name = 'Technical AI Safety (test)';
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  vi.mocked(authFetch).mockResolvedValue({ ok: true } as Response);
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Move to AGI Strategy' }));
  });
  vi.mocked(authFetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Undo move' }));
  });
  expect(screen.getByText('Save failed')).toBeTruthy();
  vi.mocked(authFetch).mockResolvedValue({ ok: true } as Response);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  });
  expect(screen.getByText('First test applicant')).toBeTruthy();
});

test('expiry with only one application restarts the timer and explains why it stays', () => {
  response.applications = [{ id: 'recOne', name: 'Only test applicant' }];
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  expire();
  expect(screen.getByText('Only test applicant')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Pause timer' }).textContent).toContain('30s');
  expect(screen.getByText('Only one application remains. Timer restarted.')).toBeTruthy();
  expire();
  expect(screen.getByRole('button', { name: 'Pause timer' }).textContent).toContain('30s');
});
