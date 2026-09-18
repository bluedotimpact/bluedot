import {
  act, cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';
import type { Application } from '../lib/client/types';
import { useNavigationState } from '../lib/client/navigation';

const { response } = vi.hoisted(() => ({ response: { applications: [] as Application[] } }));
vi.mock('axios-hooks', () => ({ default: () => [{ data: response, loading: false, error: null }] }));
vi.mock('../lib/client/api', () => ({ authFetch: vi.fn() }));
vi.mock('@bluedot/ui', () => ({
  H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  H2: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  ProgressDots: () => <span>Loading</span>,
}));
vi.mock('../components/RoundPicker', () => ({
  RoundPicker: ({ onSelect }: { onSelect: (round: { id: string; name: string; course: string }, direction: string) => void }) => <button type="button" onClick={() => onSelect({ id: 'recTestRound', name: 'AGI Strategy (test)', course: 'AGI Strategy' }, 'top')}>Start test round</button>,
}));
vi.mock('../components/ApplicationCard', () => ({ ApplicationCard: ({ application }: { application: Application }) => <p>{application.name}</p> }));
vi.mock('../components/SwipeableRatingArea', () => ({ SwipeableRatingArea: () => null }));

import SpeedReviewPage from '../pages/speed-review';

beforeEach(() => {
  vi.useFakeTimers();
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
