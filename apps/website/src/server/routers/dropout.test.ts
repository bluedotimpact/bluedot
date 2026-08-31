import {
  applicationsRoundTable, courseRegistrationTable, dropoutTable, eq,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

// The authenticated user's row is assumed to exist by the userId-scoped routes.
// Deferral targets are validated against rounds, so seed the rounds referenced by tests.
beforeEach(async () => {
  await seedLoggedInUser();
  await testDb.insert(applicationsRoundTable, { id: 'round-1', courseId: 'course-1' });
  await testDb.insert(applicationsRoundTable, { id: 'round-2', courseId: 'course-1' });
  await testDb.insert(applicationsRoundTable, { id: 'round-other-course', courseId: 'course-2' });
});

const getDropouts = async () => testDb.pg.select().from(dropoutTable.pg);

const getDecision = async (id: string) => {
  const [reg] = await testDb.pg
    .select({ decision: courseRegistrationTable.pg.decision })
    .from(courseRegistrationTable.pg)
    .where(eq(courseRegistrationTable.pg.id, id));
  return reg?.decision ?? null;
};

const insertRegistration = (overrides: Record<string, unknown>) => testDb.insert(courseRegistrationTable, {
  id: 'reg-1',
  email: 'test@example.com',
  userId: 'test-user',
  courseId: 'course-1',
  decision: 'Accept',
  roundId: 'round-1',
  ...overrides,
});

describe('dropout.dropoutOrDeferral', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).dropout.dropoutOrDeferral({ applicantId: 'reg-1', type: 'Drop out' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects a deferral request from a facilitator', async () => {
    await insertRegistration({ role: 'Facilitator' });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('rejects a drop-out from a facilitator once accepted', async () => {
    await insertRegistration({ role: 'Facilitator', decision: 'Accept' });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('lets a facilitator withdraw before acceptance (decision = null) without creating a Drop out record', async () => {
    await insertRegistration({ role: 'Facilitator', decision: null });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(result).toBeNull();
    expect(await getDecision('reg-1')).toBe('Withdrawn');
    expect(await getDropouts()).toHaveLength(0);
  });

  test('withdraws a pre-decision participant application without creating a Drop out record', async () => {
    await insertRegistration({ role: 'Participant', decision: null });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(result).toBeNull();
    expect(await getDecision('reg-1')).toBe('Withdrawn');
    expect(await getDropouts()).toHaveLength(0);
  });

  test('creates a Drop out record and leaves the decision untouched when dropping out post-decision', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept' });

    await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(await getDecision('reg-1')).toBe('Accept');
    const dropouts = await getDropouts();
    expect(dropouts).toHaveLength(1);
    expect(dropouts[0]).toMatchObject({ applicantId: ['reg-1'], type: 'Drop out' });
  });

  test('lets a participant defer once accepted', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept' });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    });
    expect(result).toBeTruthy();
    expect(await getDecision('reg-1')).toBe('Accept');
  });

  test('rejects a pre-decision participant deferral', async () => {
    await insertRegistration({ role: 'Participant', decision: null });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('rejects a deferral to a round of a different course', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept' });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-other-course',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects a deferral to a round that does not exist', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept' });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-nonexistent',
    })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('validates against the current round\'s course, not a stale registration course link', async () => {
    // Registration's course link disagrees with its round: the round's course wins.
    await insertRegistration({ role: 'Participant', decision: 'Accept', courseId: 'course-stale' });

    // Same course as the current round: allowed despite the stale link.
    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    });
    expect(result).toBeTruthy();

    // Matching the stale link but not the round's course: rejected.
    await testDb.insert(applicationsRoundTable, { id: 'round-stale-course', courseId: 'course-stale' });
    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-stale-course',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('falls back to the registration course link when there is no current round', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept', roundId: null });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    });
    expect(result).toBeTruthy();

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-2', email: 'test@example.com', userId: 'test-user', courseId: 'course-2', decision: 'Accept', roundId: null,
    });
    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-2', type: 'Deferral', newRoundId: 'round-2',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('fails closed when the current round cannot be resolved, instead of trusting the course link', async () => {
    // Registration claims a round that has no row in pg (deleted / not synced). Falling back to
    // the course link here would reopen the wrong-course hole for exactly the records where the
    // link is least trustworthy.
    await insertRegistration({ role: 'Participant', decision: 'Accept', roundId: 'round-missing' });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('fails closed when the current round has no course, instead of trusting the course link', async () => {
    await testDb.insert(applicationsRoundTable, { id: 'round-no-course', courseId: null });
    await testDb.insert(applicationsRoundTable, { id: 'round-stale-link-course', courseId: 'course-stale' });
    await insertRegistration({
      role: 'Participant', decision: 'Accept', courseId: 'course-stale', roundId: 'round-no-course',
    });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-stale-link-course',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects a deferral when the course cannot be determined', async () => {
    await insertRegistration({
      role: 'Participant', decision: 'Accept', courseId: '', roundId: null,
    });

    await expect(createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
