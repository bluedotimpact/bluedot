import {
  courseFeedbackTable,
  courseRegistrationTable,
  deletionRequestTable,
  dropoutTable,
  exerciseResponsePgTable,
  facilitatorDiscussionSwitchingTable,
  groupSwitchingTable,
  meetPersonTable,
  peerFeedbackTable,
  projectSubmissionTable,
  resourceCompletionPgTable,
  selfServeCourseRegistrationTable,
  userTable,
} from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { deleteKeycloakUser, keycloakUserExists } from '../../lib/api/keycloak';
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

vi.mock('../../lib/api/keycloak', () => ({
  deleteKeycloakUser: vi.fn(),
  keycloakUserExists: vi.fn(),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

setupTestDb();

const TEST_TOKEN = 'test-token-secret';

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
let keycloakUserPresent: boolean;
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
  keycloakUserPresent = true;
  vi.mocked(keycloakUserExists).mockImplementation(async () => keycloakUserPresent);
  vi.mocked(deleteKeycloakUser).mockImplementation(async () => {
    keycloakUserPresent = false;
  });

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
    id: 'mp-subject', name: 'Subject Person', userId: SUBJECT.id, applicationsBaseRecordId: 'reg-subject', role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: 'mp-other', name: 'Other Person', userId: 'test-user', applicationsBaseRecordId: 'reg-other', role: 'Participant',
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

const execute = (deletionRequestId: string, publicToken: string = TEST_TOKEN) => createCaller()
  .deletionRequests.executeAccountDeletion({ publicToken, deletionRequestId });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pgIdsIn = async (table: { pg: any }): Promise<string[]> => (await testDb.pg.select().from(table.pg)).map((row) => String(row.id)).sort();

// The database state every completed deletion of the seeded subject must produce, however it got there.
const expectDeletionEndState = async () => {
  expect(await pgIdsIn(userTable)).toEqual(['test-user']);
  expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject-unlinked']);
  expect(await pgIdsIn(exerciseResponsePgTable)).toEqual(['er-other']);
  expect(await pgIdsIn(resourceCompletionPgTable)).toEqual(['rc-other']);
  expect(await pgIdsIn(selfServeCourseRegistrationTable)).toEqual(['ss-other']);
  expect(await pgIdsIn(dropoutTable)).toEqual(['do-other', 'do-subject']);
  expect(await pgIdsIn(projectSubmissionTable)).toEqual(['ps-other', 'ps-shared']);
  expect(await pgIdsIn(courseFeedbackTable)).toEqual(['cf-other', 'cf-subject']);
  expect(await pgIdsIn(groupSwitchingTable)).toEqual(['gs-other', 'gs-subject']);
  expect(await pgIdsIn(facilitatorDiscussionSwitchingTable)).toEqual(['fds-other', 'fds-subject']);
  expect(airtableUserRecords.map((record) => record.id)).toEqual(['test-user']);
  expect(keycloakUserPresent).toBe(false);
  const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
  expect(request?.status).toBe('Completed');
  expect(request?.completedAt).toBeTruthy();
};

const ALL_STEPS = [
  'customerio-subscription-topics',
  'exercise-responses',
  'resource-completions',
  'self-serve-course-registrations',
  'project-submissions',
  'course-registrations',
  'user-record',
  'keycloak-user',
] as const;

const STEP_AIRTABLE_TABLES = {
  'self-serve-course-registrations': selfServeCourseRegistrationTable,
  'project-submissions': projectSubmissionTable,
  'course-registrations': courseRegistrationTable,
  'user-record': userTable,
} as const;

const STEP_PG_TABLES = {
  'exercise-responses': exerciseResponsePgTable,
  'resource-completions': resourceCompletionPgTable,
} as const;

// Makes the named step fail exactly once, through whichever channel it deletes on.
const armStepFailure = (step: (typeof ALL_STEPS)[number]) => {
  let fired = false;

  if (step === 'customerio-subscription-topics') {
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (!fired && init?.method === 'PUT') {
        fired = true;
        return new Response('nope', { status: 500 });
      }

      return fakeCio(input, init);
    }));
  } else if (step === 'keycloak-user') {
    vi.mocked(deleteKeycloakUser).mockImplementation(async () => {
      if (!fired) {
        fired = true;
        throw new Error('Keycloak down');
      }

      keycloakUserPresent = false;
    });
  } else if (step in STEP_PG_TABLES) {
    const target = STEP_PG_TABLES[step as keyof typeof STEP_PG_TABLES].pg;
    const pgDelete = testDb.pg.delete.bind(testDb.pg);
    vi.spyOn(testDb.pg, 'delete').mockImplementation(((table: unknown) => {
      if (!fired && table === target) {
        fired = true;
        throw new Error('pg delete failed');
      }

      return pgDelete(table as never);
    }) as never);
  } else {
    const target = STEP_AIRTABLE_TABLES[step as keyof typeof STEP_AIRTABLE_TABLES];
    const remove = testDb.remove.bind(testDb);
    vi.spyOn(testDb, 'remove').mockImplementation(async (table, id) => {
      if (!fired && table === (target as never)) {
        fired = true;
        throw new Error('Airtable rate limit');
      }

      return remove(table, id);
    });
  }
};

describe('deletionRequests.adminRequestAccountDeletion', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects non-admins', async () => {
    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('an admin creates a pending request carrying the subject\'s identifiers', async () => {
    await makeAdmin();

    const { request, isRetry } = await createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id });

    expect(isRetry).toBe(false);
    expect(request).toMatchObject({
      email: SUBJECT.email,
      userId: SUBJECT.id,
      keycloakIdentifier: SUBJECT.keycloakIdentifier,
      status: 'Pending',
      initiatedByRole: 'Admin',
      initiatedBy: ['test-user'],
    });
  });

  test('records the real admin as the initiator when the request is made mid-impersonation', async () => {
    await makeAdmin();

    const { request } = await createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: SUBJECT.email, sub: SUBJECT.keycloakIdentifier },
      impersonation: { adminEmail: 'test@example.com', adminSub: 'test-sub', targetEmail: SUBJECT.email },
    }).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id });

    expect(request).toMatchObject({ initiatedByRole: 'Admin', initiatedBy: ['test-user'] });
  });

  test('creating a request deletes nothing on its own', async () => {
    await seedSubjectData();
    await makeAdmin();

    await createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id });

    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject', 'reg-subject-unlinked']);
    expect(cioTopicWrites).toEqual([]);
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  test('throws NOT_FOUND when the admin targets a user that does not exist', async () => {
    await makeAdmin();

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: 'nobody' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('does not email the account through customer.io', async () => {
    await makeAdmin();

    await createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id });

    expect(cioEmailSends).toEqual([]);
  });

  test('throws CONFLICT when a pending request already exists', async () => {
    await makeAdmin();
    await seedRequest({ status: 'Pending' });

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await testDb.scan(deletionRequestTable, { userId: SUBJECT.id })).toHaveLength(1);
    expect(cioEmailSends).toEqual([]);
  });

  test('throws CONFLICT when a request is already in progress', async () => {
    await makeAdmin();
    await seedRequest({ status: 'In progress' });

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await testDb.scan(deletionRequestTable, { userId: SUBJECT.id })).toHaveLength(1);
  });

  test('throws CONFLICT when the user has already been deleted', async () => {
    await makeAdmin();
    await seedRequest({ status: 'Completed' });

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await testDb.scan(deletionRequestTable, { userId: SUBJECT.id })).toHaveLength(1);
  });

  test('revives the most recent failed request instead of creating another one', async () => {
    await makeAdmin();
    await seedRequest({ id: 'req-old', status: 'Failed', requestedAt: '2026-08-01T00:00:00.000Z' });
    await seedRequest({ id: 'req-recent', status: 'Failed', requestedAt: '2026-08-04T00:00:00.000Z' });

    const { request, isRetry } = await createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id });

    expect(isRetry).toBe(true);
    expect(request).toMatchObject({ id: 'req-recent', status: 'Pending' });

    const rows = await testDb.scan(deletionRequestTable, { userId: SUBJECT.id });
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === 'req-old')?.status).toBe('Failed');
    expect(cioEmailSends).toEqual([]);
  });

  test('throws CONFLICT instead of reviving when the user also has an active request', async () => {
    await makeAdmin();
    await seedRequest({ id: 'req-failed', status: 'Failed', requestedAt: '2026-08-01T00:00:00.000Z' });
    await seedRequest({ id: 'req-active', status: 'In progress', requestedAt: '2026-08-04T00:00:00.000Z' });

    await expect(createCaller(testAuthContextLoggedIn).deletionRequests.adminRequestAccountDeletion({ userId: SUBJECT.id }))
      .rejects.toMatchObject({ code: 'CONFLICT', message: expect.stringContaining('In progress') });

    const rows = await testDb.scan(deletionRequestTable, { userId: SUBJECT.id });
    expect(rows.find((row) => row.id === 'req-failed')?.status).toBe('Failed');
    expect(rows).toHaveLength(2);
  });
});

const seedCallerFacilitatorHistory = async (overrides: { role?: string; roundStatus?: string; isDuplicate?: boolean } = {}) => {
  const { role = 'Facilitator', ...registrationOverrides } = overrides;
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-caller', email: 'test@example.com', userId: 'test-user', courseId: 'course-1', ...registrationOverrides,
  });
  await testDb.insert(meetPersonTable, {
    id: 'mp-caller', name: 'Test User', userId: 'test-user', applicationsBaseRecordId: 'reg-caller', role,
  });
};

const requestOwnDeletion = (ctx = testAuthContextLoggedIn) => createCaller(ctx).deletionRequests.userRequestAccountDeletion();

describe('deletionRequests.userRequestAccountDeletion', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(requestOwnDeletion(testAuthContextLoggedOut)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(await testDb.pg.select().from(deletionRequestTable.pg)).toEqual([]);
  });

  test('a user creates a pending request for their own account, and is recorded as the initiator', async () => {
    const request = await requestOwnDeletion();

    expect(request).toMatchObject({
      email: 'test@example.com',
      userId: 'test-user',
      keycloakIdentifier: 'test-sub',
      status: 'Pending',
      initiatedByRole: 'User',
      initiatedBy: ['test-user'],
    });
    expect(cioEmailSends).toEqual([]);
  });

  test('blocks the request while impersonating another user', async () => {
    await expect(requestOwnDeletion({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: SUBJECT.email, sub: SUBJECT.keycloakIdentifier },
      impersonation: { adminEmail: 'test@example.com', adminSub: 'test-sub', targetEmail: SUBJECT.email },
    })).rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('impersonating') });

    expect(await testDb.pg.select().from(deletionRequestTable.pg)).toEqual([]);
    expect(cioEmailSends).toEqual([]);
  });

  test('refuses anyone who has ever facilitated, however old the round', async () => {
    await seedCallerFacilitatorHistory({ roundStatus: 'Inactive', isDuplicate: true });

    await expect(requestOwnDeletion()).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await testDb.pg.select().from(deletionRequestTable.pg)).toEqual([]);
    expect(cioEmailSends).toEqual([]);
  });

  test('allows a caller whose only course role is Participant', async () => {
    await seedCallerFacilitatorHistory({ role: 'Participant' });

    expect(await requestOwnDeletion()).toMatchObject({ status: 'Pending', initiatedByRole: 'User' });
  });

  test('refuses a caller whose course role was never assigned', async () => {
    await seedCallerFacilitatorHistory({ role: 'TODO' });

    await expect(requestOwnDeletion()).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(await testDb.pg.select().from(deletionRequestTable.pg)).toEqual([]);
    expect(cioEmailSends).toEqual([]);
  });

  test('creating a request deletes nothing on its own', async () => {
    await seedSubjectData();

    await requestOwnDeletion();

    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject', 'reg-subject-unlinked']);
    expect(cioTopicWrites).toEqual([]);
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  // Unlike an admin, a user cannot revive a failed request.
  test.each(['Pending', 'In progress', 'Completed', 'Failed'])('throws CONFLICT when a %s request already exists', async (status) => {
    await seedRequest({ userId: 'test-user', email: 'test@example.com', status });

    await expect(requestOwnDeletion()).rejects.toMatchObject({ code: 'CONFLICT' });

    const rows = await testDb.scan(deletionRequestTable, { userId: 'test-user' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe(status);
    expect(cioEmailSends).toEqual([]);
  });
});

describe('deletionRequests.selfDeletionEligibility', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).deletionRequests.selfDeletionEligibility())
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('reports a caller who has never facilitated as eligible', async () => {
    await seedCallerFacilitatorHistory({ role: 'Participant' });

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: false, hasExistingRequest: false });
  });

  test('reports a caller who has ever facilitated as blocked', async () => {
    await seedCallerFacilitatorHistory({ roundStatus: 'Inactive' });

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: true, hasExistingRequest: false });
  });

  test('reports a caller whose course role was never assigned as blocked', async () => {
    await seedCallerFacilitatorHistory({ role: 'TODO' });

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: true, hasExistingRequest: false });
  });

  test('reports a caller with no course role recorded as blocked', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-caller', email: 'test@example.com', userId: 'test-user', courseId: 'course-1',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-caller', name: 'Test User', userId: 'test-user', applicationsBaseRecordId: 'reg-caller',
    });

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: true, hasExistingRequest: false });
  });

  // A user can't retry a Failed request either, so any status counts as an existing request.
  test.each(['Pending', 'In progress', 'Completed', 'Failed'])('reports an existing %s request for the caller', async (status) => {
    await seedRequest({ userId: 'test-user', email: 'test@example.com', status });

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: false, hasExistingRequest: true });
  });

  test('ignores deletion requests belonging to other users', async () => {
    await seedRequest();

    expect(await createCaller(testAuthContextLoggedIn).deletionRequests.selfDeletionEligibility())
      .toEqual({ hasEverFacilitated: false, hasExistingRequest: false });
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

describe('deletionRequests.executeAccountDeletion', () => {
  test('throws UNAUTHORIZED when no token matches (wrong length short-circuits before timingSafeEqual)', async () => {
    await seedRequest();
    await expect(execute('req-1', 'wrong')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(execute('req-1', 'X'.repeat(TEST_TOKEN.length))).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(await testDb.getFirst(userTable, { filter: { id: SUBJECT.id } })).not.toBeNull();
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  test('throws NOT_FOUND for an unknown deletion request', async () => {
    await expect(execute('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('throws BAD_REQUEST for a request missing the identifiers the router always writes', async () => {
    await seedRequest({
      id: 'req-ghost', email: '', userId: '', keycloakIdentifier: '',
    });

    await expect(execute('req-ghost')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  test('deletes the account, its activity and its course record, in dependents-before-anchors order', async () => {
    await seedSubjectData();
    await seedRequest();

    const result = await execute('req-1');

    expect(result.status).toBe('Completed');
    expect(result.steps).toEqual([
      { step: 'customerio-subscription-topics', deleted: 1 },
      { step: 'exercise-responses', deleted: 1 },
      { step: 'resource-completions', deleted: 1 },
      { step: 'self-serve-course-registrations', deleted: 1 },
      { step: 'project-submissions', deleted: 1 },
      { step: 'course-registrations', deleted: 1 },
      { step: 'user-record', deleted: 1 },
      { step: 'keycloak-user', deleted: 1 },
    ]);

    expect(await pgIdsIn(userTable)).toEqual(['test-user']);
    expect(await pgIdsIn(exerciseResponsePgTable)).toEqual(['er-other']);
    expect(await pgIdsIn(resourceCompletionPgTable)).toEqual(['rc-other']);
    expect(await pgIdsIn(selfServeCourseRegistrationTable)).toEqual(['ss-other']);
    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject-unlinked']);
    expect(await pgIdsIn(dropoutTable)).toEqual(['do-other', 'do-subject']);
    expect(await pgIdsIn(projectSubmissionTable)).toEqual(['ps-other', 'ps-shared']);
    expect(await pgIdsIn(courseFeedbackTable)).toEqual(['cf-other', 'cf-subject']);
    expect(await pgIdsIn(groupSwitchingTable)).toEqual(['gs-other', 'gs-subject']);
    expect(await pgIdsIn(facilitatorDiscussionSwitchingTable)).toEqual(['fds-other', 'fds-subject']);

    expect(cioTopicWrites).toEqual([{
      cioId: 'cio-subject',
      topics: {
        topic_9: false, topic_12: false, topic_14: false, topic_15: false, topic_16: false,
      },
    }]);

    expect(deleteKeycloakUser).toHaveBeenCalledWith('subject-sub');

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Completed');
    expect(request?.completedAt).toBeTruthy();
  });

  test('completes when customer.io has no profile under the user id', async () => {
    cioProfiles = [];
    await seedRequest();

    const result = await execute('req-1');

    expect(result.steps[0]).toEqual({ step: 'customerio-subscription-topics', deleted: 0 });
    expect(cioTopicWrites).toEqual([]);
  });

  test('leaves the newsletter alone for a profile that signed up through the website form', async () => {
    cioProfiles[0]!.attributes.anonymous_id = 'anon-123';
    await seedRequest();

    await execute('req-1');

    expect(cioTopicWrites).toEqual([{
      cioId: 'cio-subject',
      topics: {
        topic_9: false, topic_12: false, topic_14: false, topic_16: false,
      },
    }]);
  });

  test('leaves topics the person explicitly chose, and does not rewrite ones already off', async () => {
    cioProfiles[0]!.attributes.cio_subscription_preferences = JSON.stringify({ topics: { topic_12: true, topic_14: false } });
    await seedRequest();

    await execute('req-1');

    expect(cioTopicWrites).toEqual([{
      cioId: 'cio-subject',
      topics: { topic_9: false, topic_15: false, topic_16: false },
    }]);
  });

  test('unsubscribes the profile customer.io still holds under the person\'s old email', async () => {
    cioProfiles[0]!.email = 'previous-address@example.com';
    await seedRequest();

    const result = await execute('req-1');

    expect(result.steps[0]).toEqual({ step: 'customerio-subscription-topics', deleted: 1 });
    expect(cioTopicWrites).toEqual([{
      cioId: 'cio-subject',
      topics: {
        topic_9: false, topic_12: false, topic_14: false, topic_15: false, topic_16: false,
      },
    }]);
  });

  test('completes even though customer.io has not served the new preferences back yet', async () => {
    // The write is accepted but reads keep returning the old attributes for a few seconds.
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => (
      init?.method === 'PUT' ? new Response('{}', { status: 200 }) : fakeCio(input, init))));
    await seedRequest();

    const result = await execute('req-1');

    expect(result.status).toBe('Completed');
  });

  test('marks the request failed when customer.io rejects the write', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => (
      init?.method === 'PUT' ? new Response('nope', { status: 500 }) : fakeCio(input, init))));
    await seedSubjectData();
    await seedRequest();

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Failed');
    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  test('deletes the login last, so an earlier failure leaves an account the subject can still sign into', async () => {
    await seedSubjectData();
    await seedRequest();

    vi.mocked(deleteKeycloakUser).mockImplementation(async () => {
      expect(await testDb.getFirst(userTable, { filter: { id: SUBJECT.id } })).toBeNull();
      keycloakUserPresent = false;
    });

    await execute('req-1');
    expect(deleteKeycloakUser).toHaveBeenCalledTimes(1);
  });

  test('a failure among the dependents leaves the course record standing, so a retry still finds them', async () => {
    await seedSubjectData();
    await seedRequest();

    const remove = testDb.remove.bind(testDb);
    let projectSubmissionRemoveFails = true;
    vi.spyOn(testDb, 'remove').mockImplementation(async (table, id) => {
      if (table === (projectSubmissionTable as never) && projectSubmissionRemoveFails) throw new Error('Airtable rate limit');
      return remove(table, id);
    });

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject', 'reg-subject-unlinked']);
    expect(await pgIdsIn(meetPersonTable)).toEqual(['mp-other', 'mp-subject']);
    expect(await pgIdsIn(projectSubmissionTable)).toEqual(['ps-other', 'ps-shared', 'ps-subject']);
    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(deleteKeycloakUser).not.toHaveBeenCalled();

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Failed');

    expect(slackAlert).toHaveBeenCalledOnce();
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('req-1');

    projectSubmissionRemoveFails = false;
    const retry = await execute('req-1');

    expect(retry.status).toBe('Completed');
    expect(await pgIdsIn(courseRegistrationTable)).toEqual(['reg-other', 'reg-subject-unlinked']);
    expect(await pgIdsIn(projectSubmissionTable)).toEqual(['ps-other', 'ps-shared']);
    expect(await pgIdsIn(userTable)).toEqual(['test-user']);
  });

  test('fails the request when the Applications user record survives', async () => {
    await seedSubjectData();
    await seedRequest();

    userRecordUndeletable = true;

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Failed');
    expect(slackAlert).toHaveBeenCalledOnce();
  });

  test('fails the request when the Keycloak user survives', async () => {
    await seedSubjectData();
    await seedRequest();

    vi.mocked(deleteKeycloakUser).mockResolvedValue(undefined);

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Failed');
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('Keycloak user subject-sub');
  });

  test('alerts that the request needs a manual reset when it cannot be marked failed', async () => {
    await seedSubjectData();
    await seedRequest();

    userRecordUndeletable = true;

    const update = testDb.update.bind(testDb);
    vi.spyOn(testDb, 'update').mockImplementation((table, values) => {
      if ((values as { status?: string }).status === 'Failed') throw new Error('Airtable write rejected');
      return update(table, values);
    });

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect(slackAlert).toHaveBeenCalledOnce();
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('could not be marked failed');
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain(`user record ${SUBJECT.id}`);
  });

  test('does not downgrade a request another run already completed, and says so in the alert', async () => {
    await seedSubjectData();
    await seedRequest();

    const remove = testDb.remove.bind(testDb);
    vi.spyOn(testDb, 'remove').mockImplementation(async (table, recordId) => {
      if (table === (userTable as never)) {
        await testDb.update(deletionRequestTable, { id: 'req-1', status: 'Completed' });
        throw new Error('Airtable rate limit');
      }

      return remove(table, recordId);
    });

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    const request = (await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0];
    expect(request?.status).toBe('Completed');
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('another run already completed it');
  });

  test('completes for an account with no Keycloak identifier, and never calls Keycloak', async () => {
    await seedSubjectData();
    await seedRequest({ keycloakIdentifier: '' });

    const result = await execute('req-1');

    expect(result.status).toBe('Completed');
    expect(result.steps[result.steps.length - 1]).toEqual({ step: 'keycloak-user', deleted: 0 });
    expect(keycloakUserExists).not.toHaveBeenCalled();
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
    expect(await pgIdsIn(userTable)).toEqual(['test-user']);
  });

  test('is a no-op once completed', async () => {
    await seedRequest({ status: 'Completed' });

    const result = await execute('req-1');

    expect(result).toEqual({ status: 'Completed', steps: [] });
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });

  test('refuses to start a second run while one is in progress', async () => {
    await seedSubjectData();
    await seedRequest({ status: 'In progress' });

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
    expect(deleteKeycloakUser).not.toHaveBeenCalled();
  });
});

describe('resumability: a one-time failure at any step marks the request failed, and a retry reaches the same end state', () => {
  test.each(ALL_STEPS)('%s', async (stepName) => {
    await seedSubjectData();
    await seedRequest();
    armStepFailure(stepName);

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    expect((await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0]?.status).toBe('Failed');
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain(`"${stepName}"`);

    const retry = await execute('req-1');

    expect(retry.status).toBe('Completed');
    await expectDeletionEndState();
  });
});

describe('fail-closed: another user\'s records survive even when they look like the subject\'s', () => {
  test('a decoy user sharing the subject\'s email keeps every record', async () => {
    await seedSubjectData();
    await testDb.insert(userTable, {
      id: 'user-decoy', email: SUBJECT.email, name: 'Decoy Person', keycloakIdentifier: 'decoy-sub',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-decoy', email: SUBJECT.email, userId: 'user-decoy', courseId: 'course-1',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-decoy', name: 'Decoy Person', userId: 'user-decoy', applicationsBaseRecordId: 'reg-decoy',
    });
    await testDb.insert(selfServeCourseRegistrationTable, { id: 'ss-decoy', userId: 'user-decoy', courseId: 'course-1' });
    await testDb.insert(dropoutTable, { id: 'do-decoy', applicantId: ['reg-decoy'] });
    await testDb.insert(projectSubmissionTable, { id: 'ps-decoy', participant: ['mp-decoy'] });
    await testDb.insert(courseFeedbackTable, { id: 'cf-decoy', person: ['mp-decoy'] });
    await testDb.insert(peerFeedbackTable, { id: 'pf-decoy', feedbackRecipient: ['mp-decoy'], courseFeedback: ['cf-decoy'] });
    await testDb.insert(groupSwitchingTable, { id: 'gs-decoy', participant: 'mp-decoy' });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values([{
      id: 'er-decoy', exerciseId: 'ex-1', response: 'decoy', userId: ['user-decoy'],
    }]);
    await testDb.pg.insert(resourceCompletionPgTable.pg).values([{ id: 'rc-decoy', userId: ['user-decoy'] }]);
    airtableUserRecords.push({ id: 'user-decoy' });
    await seedRequest();

    const result = await execute('req-1');

    expect(result.status).toBe('Completed');
    const decoySurvivors = [
      [userTable, 'user-decoy'],
      [courseRegistrationTable, 'reg-decoy'],
      [selfServeCourseRegistrationTable, 'ss-decoy'],
      [dropoutTable, 'do-decoy'],
      [projectSubmissionTable, 'ps-decoy'],
      [courseFeedbackTable, 'cf-decoy'],
      [peerFeedbackTable, 'pf-decoy'],
      [groupSwitchingTable, 'gs-decoy'],
      [exerciseResponsePgTable, 'er-decoy'],
      [resourceCompletionPgTable, 'rc-decoy'],
    ] as const;
    for (const [table, id] of decoySurvivors) {
      // eslint-disable-next-line no-await-in-loop
      expect(await pgIdsIn(table)).toContain(id);
    }

    expect(airtableUserRecords.map((record) => record.id)).toContain('user-decoy');
  });

  test('project submissions nobody is linked to survive', async () => {
    await seedSubjectData();
    // An empty Airtable linked-record cell syncs as an empty array, which is contained by every id list
    await testDb.insert(projectSubmissionTable, { id: 'ps-unlinked', participant: [] });
    await testDb.pg.insert(projectSubmissionTable.pg).values({ id: 'ps-unset' });
    await seedRequest();

    const result = await execute('req-1');

    expect(result.status).toBe('Completed');
    expect(result.steps).toContainEqual({ step: 'project-submissions', deleted: 1 });
    expect(await pgIdsIn(projectSubmissionTable)).toEqual(['ps-other', 'ps-shared', 'ps-unlinked', 'ps-unset']);
  });

  test('refuses to delete more rows than one account plausibly owns', async () => {
    // One over MAX_DELETIONS_PER_STEP.
    await testDb.pg.insert(exerciseResponsePgTable.pg).values(Array.from({ length: 1001 }, (_, i) => ({
      id: `er-bulk-${i}`, exerciseId: 'ex-1', response: 'r', userId: [SUBJECT.id],
    })));
    await seedRequest();

    await expect(execute('req-1')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect((await testDb.scan(deletionRequestTable, { id: 'req-1' }))[0]?.status).toBe('Failed');
    expect(vi.mocked(slackAlert).mock.calls[0]?.[1]?.[0]).toContain('more than the maximum');
    expect((await pgIdsIn(exerciseResponsePgTable)).length).toBe(1001);
    expect(await pgIdsIn(userTable)).toEqual(['test-user', SUBJECT.id]);
  });
});
