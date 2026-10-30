import '@testing-library/jest-dom';
import { calendarConnectionTable, calendarPairWithoutCalendarTable } from '@bluedot/db';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import CalendarsPage from '../../../pages/account/calendars';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../dbTestUtils';
import { TEST_CALENDAR_ENV, createFakeGoogle } from '../../fakeGoogle';
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
    expect(screen.getByRole('button', { name: 'Connect Outlook Calendar' })).toHaveAccessibleDescription('Microsoft\'s screen asks to read your calendar. We only ask it for the times you\'re busy.');
    expect(screen.getByText(/any Google or Microsoft account, work or personal/)).toBeInTheDocument();
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
    expect(screen.getByText(/^Google Calendar · Connected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a Google calendar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add an Outlook calendar' })).toBeInTheDocument();
  });

  test('labels an Outlook connection as Outlook', async () => {
    await testDb.pg.insert(calendarConnectionTable.pg).values({
      id: 'c1',
      userId: 'test-user',
      provider: 'microsoft',
      providerAccountId: 'ms-sub-1',
      providerAccountEmail: 'robin@outlook.example',
      encryptedRefreshToken: encryptRefreshToken('rt'),
      scopes: 'Calendars.ReadBasic',
    });

    renderPage();

    expect(await screen.findByText('robin@outlook.example')).toBeInTheDocument();
    expect(screen.getByText(/^Outlook Calendar · Connected/)).toBeInTheDocument();
  });

  test('without Outlook credentials, offers Google only, as before', async () => {
    const saved = TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID;
    // @ts-expect-error removing a key the type says is there
    delete TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID;
    try {
      renderPage();
      expect(await screen.findByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Connect Outlook Calendar' })).not.toBeInTheDocument();
      expect(screen.getByText(/any Google account, work or personal/)).toBeInTheDocument();
    } finally {
      TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID = saved;
    }
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

  test('explains when a work account\'s organisation must approve BlueDot first', async () => {
    routerQuery.current = { error: 'needs_admin' };
    renderPage();
    expect(await screen.findByText('Your organisation needs to approve BlueDot first')).toBeInTheDocument();
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

  describe('pairing without a calendar', () => {
    const seedCalendar = (lastError: string | null = null) => testDb.pg.insert(calendarConnectionTable.pg).values({
      id: 'c1',
      slackUserId: null,
      userId: 'test-user',
      provider: 'google',
      providerAccountId: 'sub-1',
      providerAccountEmail: 'personal@gmail.example',
      encryptedRefreshToken: encryptRefreshToken('rt'),
      scopes: 'openid email',
      lastError,
    });
    const optIns = () => testDb.pg.select().from(calendarPairWithoutCalendarTable.pg);

    test('can be turned on and stopped', async () => {
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Can\'t connect your calendar?' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Pair me without a calendar' }));

      expect(await screen.findByText('You\'ll be paired without a calendar.')).toBeInTheDocument();
      expect(await optIns()).toMatchObject([{ userId: 'test-user', slackUserId: null }]);

      fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
      expect(await screen.findByRole('button', { name: 'Pair me without a calendar' })).toBeInTheDocument();
      expect(await optIns()).toEqual([]);
    });

    test('a valid Slack link links the opt-in to that Slack member', async () => {
      vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
      routerQuery.current = { s: CONNECT_TOKEN };
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Pair me without a calendar' }));

      await waitFor(async () => expect(await optIns()).toMatchObject([{ userId: 'test-user', slackUserId: 'U0BASQRM0H2' }]));
    });

    test('is hidden when they have a working calendar', async () => {
      await seedCalendar();
      renderPage();

      expect(await screen.findByText('personal@gmail.example')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pair me without a calendar' })).not.toBeInTheDocument();
    });

    test('is offered when their only calendar needs reconnecting', async () => {
      await seedCalendar('invalid_grant');
      renderPage();

      expect(await screen.findByRole('button', { name: 'Pair me without a calendar' })).toBeInTheDocument();
    });

    test('stays visible when on, even with a working calendar, so they can stop it', async () => {
      await seedCalendar();
      await testDb.pg.insert(calendarPairWithoutCalendarTable.pg).values({ userId: 'test-user', slackUserId: null });
      renderPage();

      expect(await screen.findByText(/so we'll use that to find times you're free/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });
  });
});
