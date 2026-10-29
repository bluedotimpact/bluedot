import {
  act, cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';
import type * as BluedotUi from '@bluedot/ui';
import { useNavigationState } from '../../lib/client/navigation';
import { authFetch } from '../../lib/client/api';
import type { Course, Person } from './types';

vi.mock('../../lib/client/api', () => ({ authFetch: vi.fn() }));
const routerQuery: Record<string, string> = {};
const routerReplace = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ query: routerQuery, pathname: '/scout', replace: routerReplace }) }));
vi.mock('./PersonCard', () => ({ PersonCard: ({ person }: { person: { name: string } }) => <p>{person.name}</p> }));
vi.mock('@bluedot/ui', async () => ({
  ...(await vi.importActual<typeof BluedotUi>('@bluedot/ui')),
  Callout: ({ children, role }: { children: ReactNode; role?: string }) => <div role={role}>{children}</div>,
  H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  ProgressDots: () => <span>Loading</span>,
  Button: ({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => <button type="button" onClick={onClick} disabled={disabled}>{children}</button>,
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => (isOpen ? <div role="dialog">{children}</div> : null),
  IconButton: ({ children, onClick, disabled, title, 'aria-label': ariaLabel, 'aria-expanded': ariaExpanded }: { children?: ReactNode; onClick?: () => void; disabled?: boolean; title?: string; 'aria-label': string; 'aria-expanded'?: boolean }) => <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={ariaLabel} aria-expanded={ariaExpanded}>{children}</button>,
}));
import Scout, { goalLine, greeting, UNDO_SECONDS } from './Scout';
import { pickRecap } from './RoundPicker';

const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const person = (id: string, name: string, course: Course): Person => ({
  id, name, course, email: `${name.toLowerCase().replace(' ', '.')}@example.org`, roundName: `${course} (2026 Aug W32) - Part-time`,
  history: [], otherApplications: [], grants: [], rapidGrants: [], calls: [], reports: [], facilitatorFeedback: [], sessions: [], projects: [], feedback: [],
});
const samplePeople: Person[] = [
  person('recScoutSample001', 'Alex Morgan', 'Technical AI Safety'),
  person('recScoutSample002', 'Sam Chen', 'Technical AI Safety'),
  person('recScoutSample003', 'Jordan Patel', 'Technical AI Safety Project'),
  person('recScoutSample004', 'Riley Williams', 'Biosecurity'),
];
const mockFetch = vi.mocked(authFetch);
const realQueue = samplePeople.map((p) => ({
  id: p.id, name: p.name, email: p.email, roundId: `sample-${p.course}`, course: p.course, roundName: p.roundName, hasReport: true, hasCertificate: true, mustLook: false,
}));
const pathOf = (input: RequestInfo | URL) => (input instanceof Request ? input.url : input.toString());
const read = async (input: RequestInfo | URL) => {
  const path = pathOf(input);
  if (path.includes('/queue')) return response({ items: realQueue });
  return response({ person: samplePeople.find((p) => path.endsWith(p.id)) });
};

const decisions = () => mockFetch.mock.calls.filter(([path]) => pathOf(path).endsWith('/decision'));
// A decision is held for UNDO_SECONDS before it is saved
const passUndo = () => act(async () => {
  await vi.advanceTimersByTimeAsync(UNDO_SECONDS * 1000);
});
const undoBar = () => screen.queryAllByText(/^(Invited|Passed on) /);
const start = async () => {
  render(<Scout />);
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Invite' }).hasAttribute('disabled')).toBe(false));
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Object.keys(routerQuery).forEach((key) => delete routerQuery[key]);
  routerReplace.mockReset();
  mockFetch.mockReset().mockImplementation(read);
  useNavigationState.setState({ sessionActive: false, pendingWrites: 0, promptOpen: false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('a decision shows the next person at once and saves after the undo window; Undo and Z bring the person back with nothing saved', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: true }) : read(path)));
  await start();
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).includes('/me'))).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  expect(undoBar().length).toBeGreaterThan(0);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(decisions()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await screen.findByText('Alex Morgan');
  await passUndo();
  expect(decisions()).toHaveLength(0);

  fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
  await screen.findByText('Sam Chen');
  fireEvent.keyDown(document.body, { key: 'z' });
  await screen.findByText('Alex Morgan');
  await passUndo();
  expect(decisions()).toHaveLength(0);

  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await passUndo();
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect(undoBar()).toHaveLength(0);
  expect(JSON.parse(decisions()[0]![1]!.body as string)).toEqual({ id: samplePeople[0]!.id, decision: 'invite' });
});

test('saves run one at a time in the background while the lead keeps going; a new decision saves the previous one straight away', async () => {
  let finish!: (value: Response) => void;
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? new Promise((resolve) => {
    finish = resolve;
  }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Don’t invite' }).hasAttribute('disabled')).toBe(false));
  expect(screen.getByRole('button', { name: 'Skip' }).hasAttribute('disabled')).toBe(false);
  // Deciding on Sam saves Alex now; Sam's save waits for Alex's to finish
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  await waitFor(() => expect(decisions()).toHaveLength(1));
  await passUndo();
  expect(decisions()).toHaveLength(1);
  await act(async () => finish(response({ ok: true })));
  await waitFor(() => expect(decisions()).toHaveLength(2));
  await act(async () => finish(response({ ok: true })));
  expect(decisions().map(([, init]) => JSON.parse(init!.body as string))).toEqual([
    { id: samplePeople[0]!.id, decision: 'invite' },
    { id: samplePeople[1]!.id, decision: 'decline' },
  ]);
});

test('a failed save brings the person back after the one on screen, saying what the lead chose', async () => {
  let attempts = 0;
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method !== 'POST') return read(path);
    attempts += 1;
    return attempts === 1 ? response({ error: 'Temporary save failure' }, 503) : response({ ok: true });
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  await screen.findByText('Sam Chen');
  await passUndo();
  await waitFor(() => expect(attempts).toBe(1));
  // Still on Sam; Alex is next
  expect(screen.getByText('Sam Chen')).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Skip' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByText('Your pass on Alex Morgan didn’t go through, sorry! Please try again.');
  expect(screen.getByText('Alex Morgan')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  expect(screen.queryByText('Your pass on Alex Morgan didn’t go through, sorry! Please try again.')).toBeNull();
  await passUndo();
  await waitFor(() => expect(decisions()).toHaveLength(2));
  expect(decisions().map(([, init]) => JSON.parse(init!.body as string).id)).toEqual([samplePeople[0]!.id, samplePeople[0]!.id]);
});

test('when someone else already handled the person, the lead is told and the person does not come back', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({
    ok: false, reason: 'This person has already been invited to a call', already: 'Invited', on: '2026-10-12',
  }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  await passUndo();
  await screen.findByText('Alex Morgan was already invited on 12 Oct, so yours didn’t go through.');
  expect(screen.queryByText('Alex Morgan')).toBeNull();
  expect(screen.getByRole('button', { name: 'Skip' }).hasAttribute('disabled')).toBe(false);
});

test('retries failed participant loads and keeps decisions disabled until data is ready', async () => {
  let attempts = 0;
  mockFetch.mockImplementation(async (path) => {
    if (pathOf(path).endsWith(samplePeople[0]!.id)) {
      attempts += 1;
      if (attempts === 1) return response({ error: 'Participant load failed' }, 503);
    }

    return read(path);
  });
  render(<Scout />);
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Participant load failed');
  expect((screen.getByRole('button', { name: 'Invite' })).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Retry participant' }));
  await screen.findByText('Alex Morgan');
});

test('skip moves the person to the end of the pass and is forgotten when the round is reopened; shortcuts pause when portal navigation is open', async () => {
  await start();
  act(() => useNavigationState.setState({ promptOpen: true }));
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => useNavigationState.setState({ promptOpen: false }));
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByText('Sam Chen');
  // Everyone skipped once: say so, then the pass starts again from the first skip, no dead end
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: /Everyone seen once/ });
  expect(screen.getByText('2 skipped · 0 decided')).toBeTruthy();
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Go through the skipped again' }));
  await screen.findByText('Alex Morgan');
  expect(screen.queryByRole('heading', { name: /Round done/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Change round' }));
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Alex Morgan');
  expect(screen.getByRole('button', { name: 'Undo skip' }).hasAttribute('disabled')).toBe(true);
  expect(decisions()).toHaveLength(0);
});

test('a lead sees their own courses, the others as names that open one at a time, and everything when they lead none', async () => {
  render(<Scout />);
  await screen.findByRole('region', { name: 'Biosecurity' });
  expect(screen.getByRole('region', { name: 'Technical AI Safety' })).toBeTruthy();
  expect(screen.queryByRole('navigation', { name: 'Other courses' })).toBeNull();
  expect(screen.queryByRole('region', { name: 'This week\'s goal' })).toBeNull();
  cleanup();
  mockFetch.mockImplementation(async (path) => (pathOf(path).includes('/queue') ? response({ items: realQueue, leadCourses: ['Biosecurity'], leadName: 'Sample' }) : read(path)));
  render(<Scout />);
  await screen.findByRole('region', { name: 'Biosecurity' });
  expect(screen.queryByRole('region', { name: 'Technical AI Safety' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Technical AI Safety' }));
  expect(screen.getByRole('region', { name: 'Technical AI Safety' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close ×' }));
  expect(screen.queryByRole('region', { name: 'Technical AI Safety' })).toBeNull();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Good (morning|afternoon|evening), Sample!$/);
  expect(screen.getByText('20 more invites to hit this week’s goal!')).toBeTruthy();
});

test('the greeting follows the hour and drops the name when nobody is known', () => {
  expect(greeting('Sample', new Date('2026-10-20T09:00:00'))).toBe('Good morning, Sample!');
  expect(greeting('Sample', new Date('2026-10-20T15:00:00'))).toBe('Good afternoon, Sample!');
  expect(greeting(undefined, new Date('2026-10-20T21:00:00'))).toBe('Good evening!');
  expect(goalLine(0)).toBe('20 more invites to hit this week’s goal!');
  expect(goalLine(19)).toBe('1 more invite to hit this week’s goal!');
  expect(goalLine(20)).toBe('You invited 20 people this week, woohoo!');
  expect(goalLine(24)).toBe('You invited 24 people this week, woohoo!');
});

test('the invite that reaches 20 opens a popup once it is saved; the popup takes the keyboard, so Enter cannot act on the next person', async () => {
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    return pathOf(path).includes('/queue') ? response({ items: realQueue, leadCourses: ['Technical AI Safety'], invitedThisWeek: { 'Technical AI Safety': { total: 19, viaApp: 0 } } }) : read(path);
  });
  await start();
  expect(screen.getByText('19 / 20 this week')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  expect(screen.getByText('20 / 20 this week')).toBeTruthy();
  await passUndo();
  await screen.findByText('You achieved this week’s goal. You can stop here, or keep going if you like.');
  fireEvent.keyDown(window, { key: 'Enter' });
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(undoBar()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Keep reviewing' }));
  expect(screen.queryByText('You achieved this week’s goal. You can stop here, or keep going if you like.')).toBeNull();
  expect(screen.getByText('Sam Chen')).toBeTruthy();
  expect(decisions()).toHaveLength(1);
});

test('leaving a queue part-way notes what was done there on the main page', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: true }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  // Leaving saves the held decision straight away
  fireEvent.keyDown(window, { key: 'Escape' });
  await screen.findByText('Just now in Technical AI Safety: 1 invited · 0 not invited · 0 skipped');
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect(screen.getByText('Invited: Alex Morgan')).toBeTruthy();

  // Reopening the same queue and leaving without doing anything does not repeat the earlier invite
  fireEvent.click(screen.getByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Sam Chen');
  fireEvent.keyDown(window, { key: 'Escape' });
  await screen.findByTestId('choose-round-sample-Technical AI Safety');
  expect(screen.queryByText(/Just now in/)).toBeNull();
});

test('an invite stays in the goal until the refreshed count includes it, and is not counted twice', async () => {
  let serverTotal = 19;
  let posted = false;
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') {
      posted = true;
      return response({ ok: true });
    }

    return pathOf(path).includes('/queue')
      ? response({ items: posted ? realQueue.slice(1) : realQueue, leadCourses: ['Technical AI Safety'], invitedThisWeek: { 'Technical AI Safety': { total: serverTotal, viaApp: 0 } } })
      : read(path);
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await passUndo();
  fireEvent.click(await screen.findByRole('button', { name: 'Keep reviewing' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Change round' }));
  // Airtable has not stamped the invite date yet: the count from the server is still 19
  fireEvent.click(screen.getByRole('button', { name: 'Refresh queue' }));
  await screen.findByText('You invited 20 people this week, woohoo!');
  serverTotal = 20;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh queue' }));
  await waitFor(() => expect(mockFetch.mock.calls.filter(([path]) => pathOf(path).includes('/queue'))).toHaveLength(3));
  await screen.findByText('You invited 20 people this week, woohoo!');
});

test('a lead\'s shortlist shows first, then their first card; their backlog and the other courses load behind it, without duplicates', async () => {
  const shortlisted = { ...realQueue[3]!, mustLook: true, pickReason: 'strong yes' as const };
  mockFetch.mockImplementation(async (path) => {
    const url = pathOf(path);
    // The backlog reply repeats the shortlisted person, as a changed formula could
    if (url.includes('part=backlog')) return response({ items: [shortlisted], later: [] });
    if (url.includes('part=all')) return response({ items: realQueue.filter((item) => item.course !== 'Biosecurity'), later: [] });
    if (url.includes('/queue')) {
      return response({
        items: [shortlisted], leadCourses: ['Biosecurity'], leadName: 'Sample', later: [{ courses: ['Biosecurity'], part: 'backlog' }, { courses: ['Technical AI Safety', 'Technical AI Safety Project'], part: 'all' }],
      });
    }

    return read(path);
  });
  render(<Scout />);
  await screen.findByTestId('choose-must-look-Biosecurity');
  await waitFor(() => expect(mockFetch.mock.calls.some(([path]) => pathOf(path).endsWith('/queue?courses=Technical%20AI%20Safety%2CTechnical%20AI%20Safety%20Project&part=all'))).toBe(true));
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).endsWith('/queue?courses=Biosecurity&part=backlog'))).toBe(true);
  const paths = mockFetch.mock.calls.map(([path]) => pathOf(path));
  const firstCard = paths.findIndex((path) => path.endsWith(`/person/${shortlisted.id}`));
  expect(firstCard).toBeGreaterThanOrEqual(0);
  expect(firstCard).toBeLessThan(paths.findIndex((path) => path.includes('courses=')));
  await waitFor(() => expect(screen.queryByText('Loading the backlog…')).toBeNull());
  expect(screen.getByText('1 to review →')).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Technical AI Safety' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Technical AI Safety' }));
  expect(await screen.findByTestId('choose-round-sample-Technical AI Safety')).toBeTruthy();
});

test('on the main page the first person on the lead\'s shortlist loads before they click', async () => {
  const shortlisted = { ...realQueue[3]!, mustLook: true, pickReason: 'strong yes' as const };
  mockFetch.mockImplementation(async (path) => (pathOf(path).includes('/queue')
    ? response({ items: [shortlisted], leadCourses: ['Biosecurity'], leadName: 'Sample' })
    : read(path)));
  render(<Scout />);
  await screen.findByTestId('choose-must-look-Biosecurity');
  await waitFor(() => expect(mockFetch.mock.calls.some(([path]) => pathOf(path).endsWith(`/person/${shortlisted.id}`))).toBe(true));
});

test('the shortlist opens once its first card has loaded, so the first click never waits', async () => {
  const shortlisted = { ...realQueue[3]!, mustLook: true, pickReason: 'strong yes' as const };
  let releaseCard = () => {};
  const cardHeld = new Promise<void>((resolve) => {
    releaseCard = resolve;
  });
  mockFetch.mockImplementation(async (path) => {
    if (pathOf(path).includes('/queue')) return response({ items: [shortlisted], leadCourses: ['Biosecurity'], leadName: 'Sample' });
    if (pathOf(path).endsWith(`/person/${shortlisted.id}`)) await cardHeld;
    return read(path);
  });
  render(<Scout />);
  const button = await screen.findByTestId('choose-must-look-Biosecurity');
  expect(button.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('Getting the first person ready…')).toBeTruthy();
  releaseCard();
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
  expect(screen.getByText('1 to review →')).toBeTruthy();
});

test('a held decision counts as unsaved until it is saved, and closing the page sends it at once', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: true }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  expect(useNavigationState.getState().pendingWrites).toBe(1);
  fireEvent(window, new Event('pagehide'));
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect(decisions()[0]![1]).toMatchObject({ keepalive: true });
  expect(JSON.parse(decisions()[0]![1]!.body as string)).toEqual({ id: samplePeople[0]!.id, decision: 'invite' });
  await passUndo();
  expect(decisions()).toHaveLength(1);
  await waitFor(() => expect(useNavigationState.getState().pendingWrites).toBe(0));
});

test('moving to the next round saves the held decision', async () => {
  const sameCourseOtherRound = { ...realQueue[1]!, roundId: 'another-round', roundName: 'Technical AI Safety (2026 Jun W23) - Part-time' };
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    return pathOf(path).includes('/queue') ? response({ items: [realQueue[0]!, sameCourseOtherRound] }) : read(path);
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByRole('heading', { name: /Round done/ });
  fireEvent.click(screen.getByRole('button', { name: /Review next round/ }));
  await waitFor(() => expect(decisions()).toHaveLength(1));
  await screen.findByText('Sam Chen');
});

test('a shared link to someone in a course that loads second still opens their card', async () => {
  routerQuery.person = 'recScoutSample004';
  mockFetch.mockImplementation(async (path) => {
    const url = pathOf(path);
    if (url.includes('part=all')) return response({ items: realQueue.filter((item) => item.course === 'Biosecurity'), later: [] });
    if (url.includes('part=backlog')) return response({ items: realQueue.filter((item) => item.course === 'Technical AI Safety'), later: [] });
    if (url.includes('/queue')) return response({ items: [], leadCourses: ['Technical AI Safety'], later: [{ courses: ['Technical AI Safety'], part: 'backlog' }, { courses: ['Biosecurity'], part: 'all' }] });
    return read(path);
  });
  render(<Scout />);
  await screen.findByText('Riley Williams');
  expect(screen.queryByText('That person is not in the queue right now.')).toBeNull();
});

test('?viewAs= asks the queue for that lead', async () => {
  routerQuery.viewAs = 'lead@example.org';
  render(<Scout />);
  await screen.findByRole('region', { name: 'Biosecurity' });
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).endsWith('/queue?viewAs=lead%40example.org'))).toBe(true);
});

test('after a round, "Review next round" only offers another round of the same course; otherwise only the main page', async () => {
  const otherCourse = realQueue[3]!;
  const sameCourseOtherRound = { ...realQueue[1]!, roundId: 'another-round', roundName: 'Technical AI Safety (2026 Jun W23) - Part-time' };
  const withQueue = (items: typeof realQueue) => mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    return pathOf(path).includes('/queue') ? response({ items }) : read(path);
  });

  withQueue([realQueue[0]!, otherCourse]);
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByRole('heading', { name: /Round done/ });
  expect(screen.queryByRole('button', { name: /Review next round/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Back to main page' }));
  await screen.findByTestId('choose-round-sample-Biosecurity');
  cleanup();

  withQueue([realQueue[0]!, sameCourseOtherRound, otherCourse]);
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByRole('heading', { name: /Round done/ });
  fireEvent.click(screen.getByRole('button', { name: /Review next round/ }));
  await screen.findByText('Sam Chen');
});

test('must look is one queue per course, newest round first, and ends on "Must look is clear" with no next round', async () => {
  const older = {
    ...realQueue[0]!, mustLook: true, pickReason: 'strong yes' as const, roundEnd: '2026-09-05',
  };
  const newer = {
    ...realQueue[1]!, mustLook: true, pickReason: 'top score' as const, roundId: 'another-round', roundName: 'Technical AI Safety (2026 Sep W38) - Intensive', roundEnd: '2026-10-03',
  };
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    return pathOf(path).includes('/queue') ? response({ items: [older, newer, realQueue[2]!, realQueue[3]!] }) : read(path);
  });
  render(<Scout />);
  // Every Technical AI Safety person is must look, so there is no backlog round to pick for that course
  await screen.findByTestId('choose-must-look-Technical AI Safety');
  expect(screen.queryByTestId('choose-round-sample-Technical AI Safety')).toBeNull();
  expect(screen.getByText('2 to review →')).toBeTruthy();
  expect(screen.getByText('1 high facilitator feedback · 1 strong yes')).toBeTruthy();
  expect(pickRecap([older, newer, { ...older, id: 'recNoReason', pickReason: undefined }])).toBe('1 high facilitator feedback · 1 strong yes · 1 other');
  fireEvent.click(screen.getByTestId('choose-must-look-Technical AI Safety'));
  await screen.findByText(/0 of 2 reviewed/);
  await screen.findByText('Sam Chen');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Invite' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Alex Morgan');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Don’t invite' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  await screen.findByRole('heading', { name: /Shortlist cleared/ });
  expect(screen.queryByRole('button', { name: /Review next round/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Back to main page' }));
  await screen.findByTestId('choose-round-sample-Biosecurity');
  expect(screen.queryByTestId('choose-must-look-Technical AI Safety')).toBeNull();
});

test('a one-person round shows the pass-done screen after one skip; L opens LinkedIn, P the project; Esc returns to the main page', async () => {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const withLinkedIn = {
    ...samplePeople[0]!,
    profileUrl: 'https://www.linkedin.com/in/sample-participant',
    projects: [{
      id: 'recProjSample0001', url: 'https://files.example.org/project.pdf', scores: [], evalNotes: [], privateNotes: [],
    }],
  };
  mockFetch.mockImplementation(async (path) => {
    if (pathOf(path).includes('/queue')) return response({ items: [realQueue[0]!, realQueue[3]!] });
    return pathOf(path).endsWith(withLinkedIn.id) ? response({ person: withLinkedIn }) : read(path);
  });
  await start();
  fireEvent.keyDown(document.body, { key: 'l' });
  expect(open).toHaveBeenCalledWith('https://www.linkedin.com/in/sample-participant', '_blank', 'noopener');
  fireEvent.keyDown(document.body, { key: 'p' });
  expect(open).toHaveBeenCalledWith('https://files.example.org/project.pdf', '_blank', 'noopener');
  const skipButton = screen.getByRole('button', { name: 'Skip' });
  fireEvent.click(skipButton);
  await screen.findByRole('heading', { name: /Everyone seen once/ });
  expect(screen.getByText('1 skipped · 0 decided')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Review next round/ })).toBeNull();
  // Space is not consumed where there is no card to walk
  expect(fireEvent.keyDown(document.body, { key: ' ' })).toBe(true);
  // Esc works even with a button focused, as it is right after clicking one
  const back = screen.getByRole('button', { name: 'Back to main page' });
  back.focus();
  fireEvent.keyDown(back, { key: 'Escape' });
  await screen.findByTestId('choose-round-sample-Biosecurity');
  expect(fireEvent.keyDown(document.body, { key: ' ' })).toBe(true);
  open.mockRestore();
});

test('L only opens a link whose host really is LinkedIn', async () => {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const lookalike = { ...samplePeople[0]!, profileUrl: 'https://example.org/?site=linkedin.com' };
  mockFetch.mockImplementation(async (path) => (pathOf(path).endsWith(lookalike.id) ? response({ person: lookalike }) : read(path)));
  await start();
  fireEvent.keyDown(document.body, { key: 'l' });
  expect(open).not.toHaveBeenCalled();
  open.mockRestore();
});

test('Enter confirms the note box for an endorsed person', async () => {
  const endorsed: Person = {
    ...samplePeople[0]!, reports: [{
      id: 'recReportSample001', overallTake: 'Strong yes', facilitator: 'Sample Facilitator', nextSteps: [], ratings: [],
    }],
  };
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    if (pathOf(path).endsWith(endorsed.id)) return response({ person: endorsed });
    return read(path);
  });
  await start();
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  await screen.findByRole('dialog');
  fireEvent.keyDown(document.body, { key: 'Enter' });
  await screen.findByText('Sam Chen');
  await passUndo();
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect(JSON.parse(decisions()[0]![1]!.body as string)).toEqual({ id: samplePeople[0]!.id, decision: 'invite' });
});

test('deciding on an endorsed person asks only for a note to the facilitator, then saves it after the undo window', async () => {
  const endorsed: Person = {
    ...samplePeople[0]!, reports: [{
      id: 'recReportSample001', overallTake: 'Strong yes', facilitator: 'Sample Facilitator', quickTake: 'Sharpest questions in the group.', nextSteps: [], ratings: [{ label: 'Agency', score: 5, evidence: 'Started a reading group.' }],
    }],
  };
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') return response({ ok: true });
    if (pathOf(path).endsWith(endorsed.id)) return response({ person: endorsed });
    return read(path);
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.textContent).toContain('They endorsed Alex Morgan, so they’ll get an email saying you won’t be inviting them this time.');
  expect(dialog.textContent).not.toContain('cannot undo');
  expect(dialog.textContent).toContain('Overall take: “Sharpest questions in the group.”');
  expect(dialog.textContent).toContain('Agency 5/5: “Started a reading group.”');
  fireEvent.change(screen.getByRole('textbox', { name: 'Your note (optional)' }), { target: { value: '  Not quite ready for a call yet. ' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Don’t invite' }).slice(-1)[0]!);
  await screen.findByText('Sam Chen');
  expect(decisions()).toHaveLength(0);
  await passUndo();
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect(JSON.parse(decisions()[0]![1]!.body as string)).toEqual({ id: endorsed.id, decision: 'decline', note: 'Not quite ready for a call yet.' });
  // The next person has no endorsement: no box at all
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(undoBar().length).toBeGreaterThan(0);
});

test('chooses a round before loading people and never includes another round from the same course', async () => {
  const queue = realQueue.map((item, index) => index === 1 ? { ...item, roundId: 'another-round', roundName: 'Technical AI Safety (2026 Jun W23) - Part-time' } : item);
  mockFetch.mockImplementation(async (path) => pathOf(path).includes('/queue') ? response({ items: queue }) : read(path));
  render(<Scout />);
  await screen.findByTestId('choose-round-sample-Technical AI Safety');
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).includes('/person/'))).toBe(false);
  fireEvent.click(screen.getByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Alex Morgan');
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  // The only person in this round: the pass is over, and the other round is offered rather than borrowed from
  await screen.findByRole('heading', { name: /Everyone seen once/ });
  expect(screen.queryByText('Sam Chen')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Review next round/ }));
  await screen.findByText('Sam Chen');
  expect(decisions()).toHaveLength(0);
});

test('supports undoing a skip', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Undo skip' }));
  await screen.findByText('Alex Morgan');
  expect(decisions()).toHaveLength(0);
});

test('keeps saved decisions in the round summary after refresh and never offers to undo an email', async () => {
  let saved = false;
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method === 'POST') {
      saved = true;
      return response({ ok: true });
    }

    if (saved && pathOf(path).includes('/queue')) return response({ items: realQueue.filter((item) => item.id !== samplePeople[0]!.id) });
    return read(path);
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Change round' }));
  await waitFor(() => expect(decisions()).toHaveLength(1));
  fireEvent.click(await screen.findByRole('button', { name: 'Refresh queue' }));
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Sam Chen');
  expect(screen.getByRole('button', { name: 'Undo skip' }).hasAttribute('disabled')).toBe(true);
  expect(decisions()).toHaveLength(1);
});

test('search opens one registration, a decision on it returns to the start and removes them from the queue', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: true }) : read(path)));
  render(<Scout />);
  fireEvent.click(await screen.findByRole('button', { name: 'Search participants' }));
  const box = await screen.findByLabelText('Find a participant in the queue');
  fireEvent.change(box, { target: { value: 'jordan' } });
  fireEvent.click(await screen.findByTestId('search-result-recScoutSample003'));
  await screen.findByText('Jordan Patel');
  expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  expect(routerReplace).toHaveBeenLastCalledWith({ pathname: '/scout', query: { person: 'recScoutSample003' } }, undefined, { shallow: true });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Invite' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  // Back to the start at once, with the undo bar; saved after the window
  expect(await screen.findByLabelText('Find a participant in the queue')).toBeTruthy();
  expect(undoBar().length).toBeGreaterThan(0);
  await passUndo();
  await waitFor(() => expect(decisions()).toHaveLength(1));
  // Their round had one person, so it no longer appears in the picker
  expect(screen.queryByTestId('choose-round-sample-Technical AI Safety Project')).toBeNull();
  expect(decisions()).toHaveLength(1);
});

test('back to search starts with an empty box; a ?person= link opens the card directly', async () => {
  render(<Scout />);
  fireEvent.click(await screen.findByRole('button', { name: 'Search participants' }));
  fireEvent.change(await screen.findByLabelText('Find a participant in the queue'), { target: { value: 'example.org' } });
  expect(screen.getAllByTestId(/search-result-/)).toHaveLength(4);
  fireEvent.click(screen.getByTestId('search-result-recScoutSample002'));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));
  expect((await screen.findByLabelText('Find a participant in the queue')).getAttribute('value')).toBe('');
  expect(decisions()).toHaveLength(0);
  cleanup();

  routerQuery.person = 'recScoutSample004';
  render(<Scout />);
  await screen.findByText('Riley Williams');
  fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));
  expect(await screen.findByLabelText('Find a participant in the queue')).toBeTruthy();
  cleanup();

  routerQuery.person = 'recNotInQueue00001';
  render(<Scout />);
  await screen.findByText('That person is not in the queue right now.');
});
