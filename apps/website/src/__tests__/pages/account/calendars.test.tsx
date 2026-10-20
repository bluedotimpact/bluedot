import '@testing-library/jest-dom';
import { calendarConnectionTable } from '@bluedot/db';
import { render, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import CalendarsPage from '../../../pages/account/calendars';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../dbTestUtils';
import { createFakeGoogle } from '../../fakeGoogle';
import { encryptRefreshToken } from '../../../lib/api/calendarConnect';

vi.mock('../../../lib/api/env', async () => ({ default: (await import('../../fakeGoogle')).TEST_CALENDAR_ENV }));

vi.mock('@bluedot/ui', async () => ({
  ...await vi.importActual('@bluedot/ui'),
  withAuth: (Component: React.ComponentType) => Component,
}));

const routerQuery: { current: Record<string, string> } = { current: {} };
vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/account/calendars', isReady: true, query: routerQuery.current }),
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

setupTestDb();

// The dot-to-dot test vector: valid until 2026-11-02T15:00:00Z
const CONNECT_TOKEN = 'eyJzbGFja1VzZXJJZCI6IlUwQkFTUVJNMEgyIiwiZXhwIjoxNzkzNjMxNjAwfQ.gabhH5XDv7HFecF9TNf3n9uWychdt-swSFaS5Gv8wm4';

beforeEach(async () => {
  routerQuery.current = {};
  vi.stubGlobal('fetch', vi.fn(createFakeGoogle().fetch));
  await seedLoggedInUser();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderPage = () => render(<CalendarsPage />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });

describe('/account/calendars', () => {
  test('anyone logged in can connect, without a Slack link, and is not asked about emails', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
    expect(screen.getByText(/any Google account, work or personal/)).toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Connected calendars' })).not.toBeInTheDocument();
  });

  test('lists connected calendars and offers to add another', async () => {
    await testDb.pg.insert(calendarConnectionTable.pg).values({
      id: 'c1',
      slackUserId: null,
      userId: 'test-user',
      provider: 'google',
      providerAccountId: 'sub-1',
      providerAccountEmail: 'personal@gmail.example',
      encryptedRefreshToken: encryptRefreshToken('rt'),
      scopes: 'openid email',
    });

    renderPage();

    expect(await screen.findByText('personal@gmail.example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add another calendar' })).toBeInTheDocument();
  });

  test('a valid Slack link lets them connect with no expiry warning', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
    routerQuery.current = { s: CONNECT_TOKEN };

    renderPage();

    expect(await screen.findByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
    expect(screen.queryByText('This Slack link has expired')).not.toBeInTheDocument();
  });

  test('an expired link still lets them connect', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-12-01T00:00:00Z'), toFake: ['Date'] });
    routerQuery.current = { s: CONNECT_TOKEN };

    renderPage();

    expect(await screen.findByText('This Slack link has expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
  });

  test('shows the result of coming back from Google', async () => {
    routerQuery.current = { calendar: 'connected' };
    const { unmount } = renderPage();
    expect(await screen.findByText('Calendar connected')).toBeInTheDocument();
    unmount();

    routerQuery.current = { error: 'missing_scope' };
    renderPage();
    expect(await screen.findByText('We need permission to see when you\'re busy')).toBeInTheDocument();
  });
});
