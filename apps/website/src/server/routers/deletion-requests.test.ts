import { deletionRequestTable, userTable } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/env', () => ({
  default: {
    APP_NAME: 'website',
    PG_URL: 'postgresql://fake',
    AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake',
    ALERTS_SLACK_CHANNEL_ID: 'C',
    CLIENT_ERRORS_SLACK_CHANNEL_ID: 'C',
    ALERTS_SLACK_BOT_TOKEN: 'fake',
    KEYCLOAK_CLIENT_ID: 'fake',
    KEYCLOAK_CLIENT_SECRET: 'fake',
    CIO_APP_API_KEY: 'fake-app-key',
    CIO_TRACK_API_KEY: 'fake:track-key',
    VITEST: 'true',
  },
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

setupTestDb();

const SUBJECT = {
  id: 'user-subject',
  email: 'subject@example.com',
  name: 'Subject Person',
  keycloakIdentifier: 'subject-sub',
};

let cioEmailSends: { to: string; subject: string }[];

beforeEach(async () => {
  cioEmailSends = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (init?.method === 'POST' && url.pathname === '/v1/send/email') {
      const payload = JSON.parse(init.body as string) as { to: string; subject: string };
      cioEmailSends.push({ to: payload.to, subject: payload.subject });
      return new Response('{}', { status: 200 });
    }

    throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${url}`);
  }));

  await seedLoggedInUser();
  await testDb.insert(userTable, SUBJECT);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const makeAdmin = () => testDb.update(userTable, { id: 'test-user', isAdmin: true });

const seedRequest = (overrides: Record<string, unknown> = {}) => testDb.insert(deletionRequestTable, {
  id: 'req-1',
  email: SUBJECT.email,
  userId: SUBJECT.id,
  keycloakIdentifier: SUBJECT.keycloakIdentifier,
  status: 'Pending',
  initiatedByRole: 'User',
  requestedAt: '2026-08-03T00:00:00.000Z',
  ...overrides,
});

describe('deletionRequests.triggerAccountDeletion', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects non-admins', async () => {
    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('an admin creates a pending request carrying the subject\'s identifiers', async () => {
    await makeAdmin();

    const request = await createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id });

    expect(request).toMatchObject({
      email: SUBJECT.email,
      userId: SUBJECT.id,
      keycloakIdentifier: SUBJECT.keycloakIdentifier,
      status: 'Pending',
      initiatedByRole: 'Admin',
      initiatedBy: ['test-user'],
    });
  });

  test('throws NOT_FOUND when the admin targets a user that does not exist', async () => {
    await makeAdmin();

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: 'nobody' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('sends a confirmation email to the account being deleted', async () => {
    await makeAdmin();

    await createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id });

    await vi.waitFor(() => expect(cioEmailSends).toEqual([{ to: SUBJECT.email, subject: 'Account deletion requested' }]));
  });

  test('still creates the request when the confirmation email fails, and alerts', async () => {
    await makeAdmin();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    const request = await createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id });

    expect(request).toMatchObject({ userId: SUBJECT.id, status: 'Pending' });
    await vi.waitFor(() => expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('confirmation notice'));
    expect(cioEmailSends).toEqual([]);
  });
});

describe('deletionRequests.list', () => {
  test('rejects non-admins', async () => {
    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.list())
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('returns only admin-initiated requests', async () => {
    await makeAdmin();
    await seedRequest({ id: 'req-user', initiatedByRole: 'User' });
    await seedRequest({ id: 'req-admin', initiatedByRole: 'Admin' });

    const rows = await createCaller(testAuthContextLoggedIn).deletionRequests.list();
    expect(rows.map((row) => row.id)).toEqual(['req-admin']);
  });
});
