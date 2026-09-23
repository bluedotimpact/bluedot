import {
  act, cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';
import { useNavigationState } from '../../lib/client/navigation';
import { authFetch } from '../../lib/client/api';
import type { Course, Person } from './types';

vi.mock('../../lib/client/api', () => ({ authFetch: vi.fn() }));
const routerQuery: Record<string, string> = {};
const routerReplace = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ query: routerQuery, pathname: '/scout', replace: routerReplace }) }));
vi.mock('./PersonCard', () => ({ PersonCard: ({ person }: { person: { name: string } }) => <p>{person.name}</p> }));
vi.mock('@bluedot/ui', () => ({
  H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  ProgressDots: () => <span>Loading</span>,
  CTALinkOrButton: ({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => <button type="button" onClick={onClick} disabled={disabled}>{children}</button>,
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => (isOpen ? <div role="dialog">{children}</div> : null),
}));
import Scout from './Scout';

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
  id: p.id, name: p.name, email: p.email, roundId: `sample-${p.course}`, course: p.course, roundName: p.roundName, hasReport: true, hasCertificate: true,
}));
const pathOf = (input: RequestInfo | URL) => (input instanceof Request ? input.url : input.toString());
const read = async (input: RequestInfo | URL) => {
  const path = pathOf(input);
  if (path.endsWith('/queue')) return response({ items: realQueue });
  return response({ person: samplePeople.find((p) => path.endsWith(p.id)) });
};

const decisions = () => mockFetch.mock.calls.filter(([path]) => pathOf(path).endsWith('/decision'));
const start = async () => {
  render(<Scout />);
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Invite' }).hasAttribute('disabled')).toBe(false));
};

beforeEach(() => {
  Object.keys(routerQuery).forEach((key) => delete routerQuery[key]);
  routerReplace.mockReset();
  mockFetch.mockReset().mockImplementation(read);
  useNavigationState.setState({ sessionActive: false, pendingWrites: 0, promptOpen: false });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('loads staff review without an admin lookup and requires confirmation before writing', async () => {
  await start();
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).includes('/me'))).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  expect(decisions()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(decisions()).toHaveLength(0);
});

test('holds the selected participant and disables skipping/course changes while a save is pending', async () => {
  let finish!: (value: Response) => void;
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? new Promise((resolve) => {
    finish = resolve;
  }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
  await waitFor(() => expect(decisions()).toHaveLength(1));
  expect((screen.getByRole('button', { name: 'Skip' })).hasAttribute('disabled')).toBe(true);
  expect((screen.getByRole('button', { name: 'Change round' })).hasAttribute('disabled')).toBe(true);
  fireEvent.keyDown(document.body, { key: 'ArrowDown' });
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  fireEvent.click(screen.getByRole('button', { name: 'Sending invite…' }));
  expect(decisions()).toHaveLength(1);
  await act(async () => finish(response({ ok: true })));
  await screen.findByText('Sam Chen');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(JSON.parse(decisions()[0]![1]!.body as string)).toEqual({ id: samplePeople[0]!.id, decision: 'invite' });
});

test('keeps failed saves on the same participant and supports retry', async () => {
  let attempts = 0;
  mockFetch.mockImplementation(async (path, init) => {
    if (init?.method !== 'POST') return read(path);
    attempts += 1;
    return attempts === 1 ? response({ error: 'Temporary save failure' }, 503) : response({ ok: true });
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Don’t invite' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Don’t invite' }).slice(-1)[0]!);
  await screen.findByText('Temporary save failure');
  expect(screen.queryByText('Sam Chen')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  await screen.findByText('Sam Chen');
  expect(decisions()).toHaveLength(2);
  expect(decisions().map(([, init]) => JSON.parse(init!.body as string).id)).toEqual([samplePeople[0]!.id, samplePeople[0]!.id]);
});

test('reports decisions made elsewhere and requires refresh instead of silently advancing', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: false, reason: 'Already invited elsewhere' }) : read(path)));
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
  await screen.findByText('Already invited elsewhere');
  expect(screen.getByText('Alex Morgan')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Invite' })).hasAttribute('disabled')).toBe(true);
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
  // Everyone skipped once: the pass starts again from the first skip, no dead end
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
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

test('chooses a round before loading people and never includes another round from the same course', async () => {
  const queue = realQueue.map((item, index) => index === 1 ? { ...item, roundId: 'another-round', roundName: 'Technical AI Safety (2026 Jun W23) - Part-time' } : item);
  mockFetch.mockImplementation(async (path) => pathOf(path).endsWith('/queue') ? response({ items: queue }) : read(path));
  render(<Scout />);
  await screen.findByTestId('choose-round-sample-Technical AI Safety');
  expect(mockFetch.mock.calls.some(([path]) => pathOf(path).includes('/person/'))).toBe(false);
  fireEvent.click(screen.getByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Alex Morgan');
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  // The only person in this round: skipping brings them straight back rather than borrowing from another round
  await screen.findByText('Alex Morgan');
  expect(screen.queryByText('Sam Chen')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Change round' }));
  fireEvent.click(screen.getByTestId('choose-round-another-round'));
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

    if (saved && pathOf(path).endsWith('/queue')) return response({ items: realQueue.filter((item) => item.id !== samplePeople[0]!.id) });
    return read(path);
  });
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Change round' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Refresh queue' }));
  fireEvent.click(await screen.findByTestId('choose-round-sample-Technical AI Safety'));
  await screen.findByText('Sam Chen');
  expect(screen.getByRole('button', { name: 'Undo skip' }).hasAttribute('disabled')).toBe(true);
  expect(decisions()).toHaveLength(1);
});

test('search opens one registration, a decision on it returns to the start and removes them from the queue', async () => {
  mockFetch.mockImplementation(async (path, init) => (init?.method === 'POST' ? response({ ok: true }) : read(path)));
  render(<Scout />);
  const box = await screen.findByLabelText('Find a participant in the queue');
  fireEvent.change(box, { target: { value: 'jordan' } });
  fireEvent.click(await screen.findByTestId('search-result-recScoutSample003'));
  await screen.findByText('Jordan Patel');
  expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  expect(routerReplace).toHaveBeenLastCalledWith({ pathname: '/scout', query: { person: 'recScoutSample003' } }, undefined, { shallow: true });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Invite' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
  await screen.findByText('Jordan Patel: invitation requested. Airtable will send the email.');
  expect(screen.getByLabelText('Find a participant in the queue')).toBeTruthy();
  // Their round had one person, so it no longer appears in the picker
  expect(screen.queryByTestId('choose-round-sample-Technical AI Safety Project')).toBeNull();
  expect(decisions()).toHaveLength(1);
});

test('back to search keeps the query; a ?person= link opens the card directly', async () => {
  render(<Scout />);
  fireEvent.change(await screen.findByLabelText('Find a participant in the queue'), { target: { value: 'example.org' } });
  expect(screen.getAllByTestId(/search-result-/)).toHaveLength(4);
  fireEvent.click(screen.getByTestId('search-result-recScoutSample002'));
  await screen.findByText('Sam Chen');
  fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));
  expect((await screen.findByLabelText('Find a participant in the queue')).getAttribute('value')).toBe('example.org');
  expect(decisions()).toHaveLength(0);
  cleanup();

  routerQuery.person = 'recScoutSample004';
  render(<Scout />);
  await screen.findByText('Riley Williams');
  expect(screen.getByRole('button', { name: 'Back to search' })).toBeTruthy();
  cleanup();

  routerQuery.person = 'recNotInQueue00001';
  render(<Scout />);
  await screen.findByText('That person is not in the queue right now.');
});
