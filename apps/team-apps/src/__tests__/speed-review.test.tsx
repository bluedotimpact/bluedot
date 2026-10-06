import {
  act, cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';
import type { Application, QueueFilters } from '../lib/client/types';
import { useNavigationState } from '../lib/client/navigation';

type AxiosResult = { data?: unknown; loading: boolean; error: Error | null };
const {
  response, testRound, axiosResults, axiosUrls,
} = vi.hoisted(() => ({
  response: { applications: [] as Application[], nextOffset: undefined as string | undefined },
  testRound: { name: 'AGI Strategy (test)' },
  // Results for specific URLs; every other request gets the applications response.
  axiosResults: {} as Record<string, AxiosResult>,
  axiosUrls: [] as string[],
}));
vi.mock('axios-hooks', () => ({
  default: ({ url }: { url: string }) => {
    axiosUrls.push(url);
    return [axiosResults[url] ?? { data: response, loading: false, error: null }];
  },
}));
vi.mock('../lib/client/api', () => ({ authFetch: vi.fn() }));
vi.mock('@bluedot/ui', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => <button type="button" onClick={onClick}>{children}</button>,
  H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  H2: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  Callout: ({ children, role }: { children?: ReactNode; role?: string }) => <div role={role}>{children}</div>,
  Modal: ({ isOpen, title, children }: { isOpen: boolean; title?: ReactNode; children?: ReactNode }) => (
    isOpen ? <div role="dialog"><h2>{title}</h2>{children}</div> : null
  ),
  ProgressDots: () => <span>Loading</span>,
}));
vi.mock('../components/RoundPicker', () => ({
  RoundPicker: ({ onSelect, notice }: { onSelect: (round: { id: string; name: string; course: string }, direction: string, filters?: QueueFilters) => void; notice?: string }) => {
    const round = { id: 'recTestRound', name: testRound.name, course: (testRound.name.split('(')[0] ?? testRound.name).trim() };
    return (
      <>
        {notice && <p role="alert">{notice}</p>}
        <button type="button" onClick={() => onSelect(round, 'top')}>Start test round</button>
        <button type="button" onClick={() => onSelect(round, 'top', { optionIds: ['recSampleFilterA', 'recSampleFilterB'], mode: 'all' })}>Start filtered test round</button>
      </>
    );
  },
}));
vi.mock('../components/ApplicationCard', () => ({ ApplicationCard: ({ application }: { application: Application }) => <p>{application.name}</p> }));
vi.mock('../components/MoveCourseControl', () => ({
  MoveCourseControl: ({ targetCourse, onMoved }: { targetCourse: string; onMoved: (roundName: string) => void }) => <button type="button" onClick={() => onMoved(`${targetCourse} (target)`)}>Move to {targetCourse}</button>,
}));

import { authFetch } from '../lib/client/api';
import SpeedReviewPage from '../pages/speed-review';
import type * as RoundPickerModule from '../components/RoundPicker';

const { RoundPicker } = await vi.importActual<typeof RoundPickerModule>('../components/RoundPicker');

beforeEach(() => {
  vi.useFakeTimers();
  testRound.name = 'AGI Strategy (test)';
  response.nextOffset = undefined;
  axiosUrls.length = 0;
  Object.keys(axiosResults).forEach((url) => {
    delete axiosResults[url];
  });
  window.localStorage.clear();
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

test('an in-flight queue from an earlier visit rehydrates the tracker on load', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  vi.mocked(authFetch).mockImplementation(async (input) => {
    const url = input as string;
    if (url.startsWith('/api/decision-email-counts')) {
      return {
        ok: true,
        json: async () => ({
          reviewed: 5, alreadySent: 4, confirmedSent: 1, pending: 1, pendingAccepted: 1, pendingRejected: 0,
        }),
      } as Response;
    }

    if (url.startsWith('/api/round-stats')) {
      return { ok: true, json: async () => ({ total: 5, evaluated: 4, accepted: 2 }) } as Response;
    }

    return { ok: true } as Response;
  });
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  expect(screen.getByText('Sending emails… (0 of 3) You can leave this page.')).toBeTruthy();
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

  // A flag batch lands (pending drops) while the request is still held.
  counts.pending -= 1;
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByText('Queueing emails… (1 of 1) Keep this page open.')).toBeTruthy();

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

const FILTERED_QUERY = 'filters=recSampleFilterA%2CrecSampleFilterB&match=all';

test('an unfiltered session requests applications exactly as before', () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start test round' }));
  expect(axiosUrls).toContain('/api/applications?round=recTestRound&direction=top');
  expect(screen.queryByText('Filtered queue')).toBeNull();
});

test('a filtered session sends its selection with the first load and every prefetch, and says the queue is filtered', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }, { id: 'recTwo', name: 'Second test applicant' }];
  response.nextOffset = 'itrNextPage';
  vi.mocked(authFetch).mockResolvedValue({ ok: true, json: async () => ({ applications: [] }) } as Response);
  render(<SpeedReviewPage />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start filtered test round' }));
  });
  expect(axiosUrls).toContain(`/api/applications?round=recTestRound&direction=top&${FILTERED_QUERY}`);
  expect(authFetch).toHaveBeenCalledWith(`/api/applications?round=recTestRound&direction=top&${FILTERED_QUERY}&offset=itrNextPage`);
  expect(screen.getByText('Filtered queue')).toBeTruthy();
});

test('a filtered summary labels whole-round numbers and reviewing the round again keeps the filters', async () => {
  response.applications = [{ id: 'recOne', name: 'First test applicant' }];
  mockSummaryApis();
  render(<SpeedReviewPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Start filtered test round' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Yes →' }));
  });
  await act(async () => {});

  expect(screen.getByText('Whole round: 1 of 3 reviewed')).toBeTruthy();
  expect(screen.getByText('Whole round: 1 of 3 reviewed sent')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send all reviewed in round (2)' })).toBeTruthy();
  axiosUrls.length = 0;
  fireEvent.click(screen.getByRole('button', { name: 'Review same round again' }));
  expect(axiosUrls).toContain(`/api/applications?round=recTestRound&direction=top&${FILTERED_QUERY}`);
});

test('a filtered session with no matches says so instead of suggesting the round is still open', async () => {
  response.applications = [];
  mockSummaryApis();
  render(<SpeedReviewPage />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start filtered test round' }));
  });
  expect(screen.getByText('No matching applications')).toBeTruthy();
});

test('a filtered round that fails to load returns to the picker and says why', async () => {
  axiosResults[`/api/applications?round=recTestRound&direction=top&${FILTERED_QUERY}`] = { data: undefined, loading: false, error: new Error('Request failed with status code 400') };
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<SpeedReviewPage />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start filtered test round' }));
  });
  expect(screen.getByRole('alert').textContent).toContain('couldn\'t be loaded with the selected filters');
  expect(screen.getByRole('button', { name: 'Start test round' })).toBeTruthy();
});

describe('round picker', () => {
  const pickerRound = { id: 'recPickerRound', name: 'AGI Strategy (sample round)', course: 'AGI Strategy' };
  const sampleOptions = [{ id: 'recSampleFilterA', label: 'Sample filter A' }, { id: 'recSampleFilterB', label: 'Sample filter B' }];
  const offer = (filterOptions: AxiosResult) => {
    axiosResults['/api/rounds'] = { data: { rounds: [pickerRound] }, loading: false, error: null };
    axiosResults['/api/filter-options'] = filterOptions;
  };

  test('lists the options and sends the ticked ones with the chosen match', () => {
    offer({ data: { options: sampleOptions }, loading: false, error: null });
    const onSelect = vi.fn();
    render(<RoundPicker onSelect={onSelect} />);
    expect(screen.getByRole('group', { name: 'Only show applicants matching' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample filter A' }));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'All' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample filter B' }));
    expect(screen.getByRole('button', { name: 'Any' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    fireEvent.click(screen.getByRole('button', { name: pickerRound.name }));
    expect(onSelect).toHaveBeenCalledWith(pickerRound, 'top', { optionIds: ['recSampleFilterA', 'recSampleFilterB'], mode: 'all' });
    expect(window.localStorage.getItem('speed-review:filters')).toBe('recSampleFilterA,recSampleFilterB');
    expect(window.localStorage.getItem('speed-review:filter-match')).toBe('all');
  });

  test('restores the stored selection minus options no longer offered, and Clear unticks everything', () => {
    window.localStorage.setItem('speed-review:filters', 'recSampleFilterRetired,recSampleFilterB');
    offer({ data: { options: sampleOptions }, loading: false, error: null });
    const onSelect = vi.fn();
    render(<RoundPicker onSelect={onSelect} />);
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Sample filter B' }).checked).toBe(true);
    expect(window.localStorage.getItem('speed-review:filters')).toBe('recSampleFilterB');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getAllByRole<HTMLInputElement>('checkbox').every((box) => !box.checked)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: pickerRound.name }));
    expect(onSelect).toHaveBeenCalledWith(pickerRound, 'top', undefined);
  });

  test('stops new ticks at the API limit of 20 and says so', () => {
    const manyOptions = Array.from({ length: 21 }, (_, index) => ({ id: `recSampleFilter${index}`, label: `Sample filter ${index + 1}` }));
    offer({ data: { options: manyOptions }, loading: false, error: null });
    const onSelect = vi.fn();
    render(<RoundPicker onSelect={onSelect} />);
    manyOptions.slice(0, 20).forEach(({ label }) => fireEvent.click(screen.getByRole('checkbox', { name: label })));
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Sample filter 21' }).disabled).toBe(true);
    expect(screen.getByText('You can tick up to 20 at a time.')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample filter 1' }));
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Sample filter 21' }).disabled).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample filter 1' }));
    fireEvent.click(screen.getByRole('button', { name: pickerRound.name }));
    expect(onSelect.mock.calls[0]?.[2]?.optionIds).toHaveLength(20);
  });

  test('still works when the browser blocks storage', () => {
    const blocked = () => {
      throw new Error('Storage is blocked');
    };

    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(blocked);
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(blocked);
    offer({ data: { options: sampleOptions }, loading: false, error: null });
    const onSelect = vi.fn();
    render(<RoundPicker onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bottom of pile' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample filter A' }));
    fireEvent.click(screen.getByRole('button', { name: pickerRound.name }));
    expect(onSelect).toHaveBeenCalledWith(pickerRound, 'bottom', { optionIds: ['recSampleFilterA'], mode: 'any' });
    expect(getItem).toHaveBeenCalled();
    expect(setItem).toHaveBeenCalled();
  });

  test('shows why it is back, when told', () => {
    offer({ data: { options: sampleOptions }, loading: false, error: null });
    render(<RoundPicker onSelect={vi.fn()} notice="Sample notice" />);
    expect(screen.getByRole('alert').textContent).toBe('Sample notice');
  });

  test.each([
    ['no options are offered', { data: { options: [] }, loading: false, error: null }],
    ['the options fail to load', { data: undefined, loading: false, error: new Error('Request failed with status code 500') }],
  ])('hides the section when %s and still starts an unfiltered round', (_, filterOptions) => {
    window.localStorage.setItem('speed-review:filters', 'recSampleFilterA');
    offer(filterOptions);
    const onSelect = vi.fn();
    render(<RoundPicker onSelect={onSelect} />);
    expect(screen.queryByText('Only show applicants matching')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: pickerRound.name }));
    expect(onSelect).toHaveBeenCalledWith(pickerRound, 'top', undefined);
  });
});
