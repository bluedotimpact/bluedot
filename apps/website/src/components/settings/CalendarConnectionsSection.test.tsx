import '@testing-library/jest-dom';
import { calendarConnectionTable } from '@bluedot/db';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import { createFakeGoogle } from '../../__tests__/fakeGoogle';
import { encryptRefreshToken } from '../../lib/api/calendarConnect';
import CalendarConnectionsSection from './CalendarConnectionsSection';

vi.mock('../../lib/api/env', async () => ({ default: (await import('../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));

const routerQuery: { current: Record<string, string> } = { current: {} };
const replace = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/account', query: routerQuery.current, replace }),
}));

setupTestDb();

beforeEach(async () => {
  routerQuery.current = {};
  vi.stubGlobal('fetch', vi.fn(createFakeGoogle().fetch));
  await seedLoggedInUser();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const seed = (id: string, lastError: string | null = null) => testDb.pg.insert(calendarConnectionTable.pg).values({
  id,
  slackUserId: 'U1',
  userId: 'test-user',
  provider: 'google',
  providerAccountId: `sub-${id}`,
  providerAccountEmail: `${id}@gmail.example`,
  encryptedRefreshToken: encryptRefreshToken(`rt-${id}`),
  scopes: 'openid email',
  lastError,
  createdAt: '2026-10-15T10:00:00Z',
});

const renderSection = () => render(<CalendarConnectionsSection />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });

describe('CalendarConnectionsSection', () => {
  test('renders nothing for someone who has never connected a calendar', async () => {
    const { container } = renderSection();
    // Give the list query time to resolve, then check nothing appeared
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(container).toBeEmptyDOMElement();
  });

  test('lists connected calendars, flags broken ones, and disconnects', async () => {
    await seed('personal');
    await seed('work', 'invalid_grant');

    renderSection();

    expect(await screen.findByRole('heading', { name: 'Connected calendars' })).toBeInTheDocument();
    expect(screen.getByText('personal@gmail.example')).toBeInTheDocument();
    expect(screen.getByText('work@gmail.example')).toBeInTheDocument();
    expect(screen.getAllByText(/Connected 15 Oct 2026/)).toHaveLength(2);
    expect(screen.getAllByText(/can't read this calendar any more/)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add another calendar' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect personal@gmail.example' }));

    await waitFor(() => expect(screen.queryByText('personal@gmail.example')).not.toBeInTheDocument());
    expect((await testDb.pg.select().from(calendarConnectionTable.pg)).map((r) => r.id)).toEqual(['work']);
  });

  test('confirms a new connection and tidies the URL', async () => {
    routerQuery.current = { calendar: 'connected' };
    await seed('personal');

    renderSection();

    expect(await screen.findByText('Calendar connected')).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/account', undefined, { shallow: true });
  });
});
