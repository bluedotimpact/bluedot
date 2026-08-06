import {
  courseFeedbackTable,
  courseRegistrationTable,
  deletionRequestTable,
  dropoutTable,
  exerciseResponsePgTable,
  facilitatorDiscussionSwitchingTable,
  groupSwitchingTable,
  meetPersonTable,
  projectSubmissionTable,
  resourceCompletionPgTable,
  selfServeCourseRegistrationTable,
  userTable,
} from '@bluedot/db';
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
    AIRTABLE_AUTOMATION_TOKEN: 'test-token-secret',
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

const ALL_TOPIC_IDS = [9, 12, 14, 15, 16];

type CioProfile = { cioId: string; id?: string; email: string; attributes: Record<string, string> };

let airtableUserRecords: { id: string }[];
let userRecordUndeletable: boolean;
let cioProfiles: CioProfile[];
let cioTopicWrites: { cioId: string; topics: Record<string, boolean> }[];
let cioEmailSends: { to: string; subject: string }[];

const fakeCio = async (input: string, init?: RequestInit) => {
  const url = new URL(input);
  const method = init?.method ?? 'GET';
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  const attributesMatch = /^\/v1\/customers\/(.+)\/attributes$/.exec(url.pathname);
  if (method === 'GET' && attributesMatch && url.searchParams.get('id_type') === 'id') {
    const profile = cioProfiles.find((p) => p.id === decodeURIComponent(attributesMatch[1]!));
    return profile
      ? ok({ customer: { identifiers: { cio_id: profile.cioId, id: profile.id, email: profile.email }, attributes: profile.attributes } })
      : new Response('{}', { status: 404 });
  }

  const preferencesMatch = /^\/v1\/customers\/(.+)\/subscription_preferences$/.exec(url.pathname);
  if (method === 'GET' && preferencesMatch) {
    const profile = cioProfiles.find((p) => p.cioId === decodeURIComponent(preferencesMatch[1]!));
    if (!profile) return new Response('{}', { status: 404 });
    // Every topic is subscribed-by-default: effective state is the default overridden by explicit choices.
    const raw = profile.attributes.cio_subscription_preferences;
    const chosen: Record<string, boolean> = raw ? JSON.parse(raw).topics : {};
    return ok({ customer: { topics: ALL_TOPIC_IDS.map((id) => ({ id, subscribed: chosen[`topic_${id}`] ?? true })) } });
  }

  if (method === 'POST' && url.pathname === '/v1/send/email') {
    const payload = JSON.parse(init!.body as string) as { to: string; subject: string };
    cioEmailSends.push({ to: payload.to, subject: payload.subject });
    return ok({});
  }

  const trackMatch = /^\/api\/v1\/customers\/cio_(.+)$/.exec(url.pathname);
  if (method === 'PUT' && trackMatch) {
    const cioId = trackMatch[1]!;
    const profile = cioProfiles.find((p) => p.cioId === cioId)!;
    const { topics } = JSON.parse(init!.body as string).cio_subscription_preferences as { topics: Record<string, boolean> };
    cioTopicWrites.push({ cioId, topics });
    const existing = profile.attributes.cio_subscription_preferences;
    profile.attributes.cio_subscription_preferences = JSON.stringify({
      topics: { ...(existing ? JSON.parse(existing).topics : {}), ...topics },
    });
    return ok({});
  }

  throw new Error(`Unexpected fetch: ${method} ${url}`);
};

beforeEach(async () => {
  cioProfiles = [{
    cioId: 'cio-subject', id: SUBJECT.id, email: SUBJECT.email, attributes: {},
  }];
  cioTopicWrites = [];
  cioEmailSends = [];
  vi.stubGlobal('fetch', vi.fn(fakeCio));

  airtableUserRecords = [{ id: SUBJECT.id }, { id: 'test-user' }];
  userRecordUndeletable = false;

  vi.spyOn(testDb.airtableClient, 'scan').mockImplementation(async (table, params) => {
    if (table.tableId !== userTable.airtable.tableId) throw new Error(`Unexpected scan of ${table.tableId}`);
    const formula = params?.filterByFormula;
    if (formula === undefined) return airtableUserRecords as never;
    return airtableUserRecords.filter((record) => formula.includes(`RECORD_ID()='${record.id}'`)) as never;
  });

  const removeFromAirtable = testDb.airtableClient.remove.bind(testDb.airtableClient);
  vi.spyOn(testDb.airtableClient, 'remove').mockImplementation(async (table, id) => {
    if (table.tableId === userTable.airtable.tableId && !userRecordUndeletable) {
      airtableUserRecords = airtableUserRecords.filter((record) => record.id !== id);
    }

    return removeFromAirtable(table, id);
  });

  await seedLoggedInUser();
  await testDb.insert(userTable, SUBJECT);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const makeAdmin = () => testDb.update(userTable, { id: 'test-user', isAdmin: true });

const seedSubjectData = async () => {
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-subject', email: SUBJECT.email, userId: SUBJECT.id, courseId: 'course-1',
  });
  // No user link: an undefined state that deletion leaves alone.
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-subject-unlinked', email: 'SUBJECT@Example.com', courseId: 'course-1',
  });
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-other', email: 'other@example.com', userId: 'test-user', courseId: 'course-1',
  });
  await testDb.insert(meetPersonTable, {
    id: 'mp-subject', name: 'Subject Person', userId: SUBJECT.id, applicationsBaseRecordId: 'reg-subject',
  });
  await testDb.insert(meetPersonTable, {
    id: 'mp-other', name: 'Other Person', userId: 'test-user', applicationsBaseRecordId: 'reg-other',
  });

  await testDb.insert(dropoutTable, { id: 'do-subject', applicantId: ['reg-subject'] });
  await testDb.insert(dropoutTable, { id: 'do-other', applicantId: ['reg-other'] });
  await testDb.insert(projectSubmissionTable, { id: 'ps-subject', participant: ['mp-subject'] });
  await testDb.insert(projectSubmissionTable, { id: 'ps-shared', participant: ['mp-subject', 'mp-other'] });
  await testDb.insert(projectSubmissionTable, { id: 'ps-other', participant: ['mp-other'] });
  await testDb.insert(courseFeedbackTable, { id: 'cf-subject', person: ['mp-subject'] });
  await testDb.insert(courseFeedbackTable, { id: 'cf-other', person: ['mp-other'] });
  await testDb.insert(groupSwitchingTable, { id: 'gs-subject', participant: 'mp-subject' });
  await testDb.insert(groupSwitchingTable, { id: 'gs-other', participant: 'mp-other' });
  await testDb.insert(facilitatorDiscussionSwitchingTable, { id: 'fds-subject', facilitator: 'mp-subject' });
  await testDb.insert(facilitatorDiscussionSwitchingTable, { id: 'fds-other', facilitator: 'mp-other' });

  await testDb.insert(selfServeCourseRegistrationTable, {
    id: 'ss-subject', userId: SUBJECT.id, courseId: 'course-1',
  });
  await testDb.insert(selfServeCourseRegistrationTable, {
    id: 'ss-other', userId: 'test-user', courseId: 'course-1',
  });

  await testDb.pg.insert(exerciseResponsePgTable.pg).values([
    {
      id: 'er-subject', exerciseId: 'ex-1', response: 'mine', userId: [SUBJECT.id],
    },
    {
      id: 'er-other', exerciseId: 'ex-1', response: 'theirs', userId: ['test-user'],
    },
  ]);
  await testDb.pg.insert(resourceCompletionPgTable.pg).values([
    { id: 'rc-subject', userId: [SUBJECT.id] },
    { id: 'rc-other', userId: ['test-user'] },
  ]);
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pgIdsIn = async (table: { pg: any }): Promise<string[]> => (await testDb.pg.select().from(table.pg)).map((row) => String(row.id)).sort();

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

  test('creating a request deletes nothing on its own', async () => {
    await seedSubjectData();
    await makeAdmin();

    await createCaller(testAuthContextLoggedIn).deletionRequests.triggerAccountDeletion({ userId: SUBJECT.id });

    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject', 'reg-subject-unlinked']);
    expect(cioTopicWrites).toEqual([]);
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
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (init?.method === 'POST' && new URL(input).pathname === '/v1/send/email') {
        return new Response('nope', { status: 500 });
      }

      return fakeCio(input, init);
    }));

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
