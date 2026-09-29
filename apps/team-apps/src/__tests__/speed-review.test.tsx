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
  Callout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Modal: ({ isOpen, title, children }: { isOpen: boolean; title?: ReactNode; children?: ReactNode }) => (
    isOpen ? <div role="dialog"><h2>{title}</h2>{children}</div> : null
  ),
  ProgressDots: () => <span>Loading</span>,
}));
vi.mock('../components/RoundPicker', () => ({
  RoundPicker: ({ onSelect }: { onSelect: (round: { id: string; name: string; course: string }, direction: string) => void }) => <button type="button" onClick={() => onSelect({ id: 'recTestRound', name: testRound.name, course: (testRound.name.split('(')[0] ?? testRound.name).trim() }, 'top')}>Start test round</button>,
}));
vi.mock('../components/ApplicationCard', () => ({ ApplicationCard: ({ application }: { application: Application }) => <p>{application.name}</p> }));
vi.mock('../components/MoveCourseControl', () => ({
  MoveCourseControl: ({ targetCourse, onMoved }: { targetCourse: string; onMoved: (roundName: string) => void }) => <button type="button" onClick={() => onMoved(`${targetCourse} (target)`)}>Move to {targetCourse}</button>,
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
  expect(authFetch).toHaveBeenCalledWith('/api/undo-move', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ applicationId: 'recOne', roundId: 'recTestRound', restoreCourse: 'Technical AI Safety' }),
  }));
  expect(screen.getByText('First test applicant')).toBeTruthy();
});

test('reviewing a Technical AI Safety Project round offers a move to Technical AI Safety', async () => {
  testRound.name = 'Technical AI Safety Project (test)';
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  vi.mocked(authFetch).mockResolvedValue({ ok: true } as Response);
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Move to Technical AI Safety' }));
  });
  expect(screen.getByText('Moved First test applicant')).toBeTruthy();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Undo move' }));
  });
  expect(authFetch).toHaveBeenCalledWith('/api/undo-move', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ applicationId: 'recOne', roundId: 'recTestRound', restoreCourse: 'Technical AI Safety Project' }),
  }));
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

const mockSummaryApis = ({ instantConfirm = true } = {}) => {
  const counts = {
    reviewed: 3, alreadySent: 1, confirmedSent: 1, pending: 2, pendingAccepted: 1, pendingRejected: 1,
  };
  // The page only ever fetches string URLs, so the mock can treat input as one.
  vi.mocked(authFetch).mockImplementation(async (input, init) => {
    const url = input as string;
    if (url.startsWith('/api/send-decision-emails')) {
      const body = JSON.parse(init?.body as string) as { applicationIds?: string[] };
      const flagged = body.applicationIds?.length ?? counts.pending;
      counts.alreadySent += flagged;
      counts.pending -= flagged;
      // The automation confirms sends asynchronously; instantConfirm mirrors it
      // in the same request, otherwise the test bumps confirmedSent itself.
      if (instantConfirm) counts.confirmedSent += flagged;
      return { ok: true, json: async () => ({ flagged }) } as Response;
    }

    if (url.startsWith('/api/decision-email-counts')) {
      return { ok: true, json: async () => ({ ...counts }) } as Response;
    }

    if (url.startsWith('/api/round-stats')) {
      return { ok: true, json: async () => ({ total: 3, evaluated: 1, accepted: 1 }) } as Response;
    }

    return { ok: true } as Response;
  });
  return counts;
};

test('summary offers both send buttons and flags the session applications after confirmation', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  mockSummaryApis();
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {}); // Let the summary's stats and counts fetches resolve

  expect(screen.getByText('1 of 3 reviewed sent')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send all reviewed (2)' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Send for this session (1)' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByText('Acceptance emails')).toBeTruthy();
  expect(screen.getByText('Rejection emails')).toBeTruthy();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send 1 email' }));
  });
  expect(authFetch).toHaveBeenCalledWith('/api/send-decision-emails', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ roundId: 'recTestRound', applicationIds: ['recOne'] }),
  }));
  expect(screen.getByText('Decision email sent.')).toBeTruthy();
});

test('a large send shows queueing progress while the flags are being written', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  let releaseSend: (() => void) | undefined;
  const counts = {
    reviewed: 3, alreadySent: 1, confirmedSent: 1, pending: 2, pendingAccepted: 1, pendingRejected: 1,
  };
  vi.mocked(authFetch).mockImplementation(async (input) => {
    const url = input as string;
    if (url.startsWith('/api/send-decision-emails')) {
      // Hold the flagging request open so the queueing state is observable.
      await new Promise<void>((resolve) => {
        releaseSend = resolve;
      });
      counts.alreadySent += 1;
      counts.confirmedSent += 1;
      counts.pending -= 1;
      return { ok: true, json: async () => ({ flagged: 1 }) } as Response;
    }

    if (url.startsWith('/api/decision-email-counts')) {
      return { ok: true, json: async () => ({ ...counts }) } as Response;
    }

    if (url.startsWith('/api/round-stats')) {
      return { ok: true, json: async () => ({ total: 3, evaluated: 1, accepted: 1 }) } as Response;
    }

    return { ok: true } as Response;
  });
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  fireEvent.click(screen.getByRole('button', { name: 'Send for this session (1)' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send 1 email' }));
  });
  expect(screen.getByText('Queueing emails… (0 of 1) Keep this page open.')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();

  await act(async () => {
    releaseSend!();
  });
  expect(screen.getByText('Decision email sent.')).toBeTruthy();
});

test('the sent tracker counts up as the automation confirms, then reports done', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  const counts = mockSummaryApis({ instantConfirm: false });
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  fireEvent.click(screen.getByRole('button', { name: 'Send for this session (1)' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send 1 email' }));
  });
  expect(screen.getByText('Sending emails… (0 of 1) You can leave this page.')).toBeTruthy();

  counts.confirmedSent += 1;
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByText('Decision email sent.')).toBeTruthy();
});

test('applications moved to AGI Strategy are excluded from the session send', async () => {
  testRound.name = 'Technical AI Safety (test)';
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  mockSummaryApis();
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Move to AGI Strategy' }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  expect(screen.getByRole('button', { name: 'Send for this session (1)' })).toBeTruthy();
});

test('cancelling the confirm step sends nothing', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  mockSummaryApis();
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  fireEvent.click(screen.getByRole('button', { name: 'Send all reviewed (2)' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send 2 emails' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(vi.mocked(authFetch).mock.calls.every(([url]) => typeof url === 'string' && !url.startsWith('/api/send-decision-emails'))).toBe(true);
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
