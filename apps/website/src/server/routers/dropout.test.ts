import { courseRegistrationTable, eq, userTable } from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await testDb.insert(userTable, { id: 'user-test', email: 'test@example.com', name: 'Test User' });
});

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
  userId: 'user-test',
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

  test('lets a facilitator withdraw before acceptance (decision = null) and sets decision to Withdrawn', async () => {
    await insertRegistration({ role: 'Facilitator', decision: null });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(result).toBeTruthy();
    expect(await getDecision('reg-1')).toBe('Withdrawn');
  });

  test('sets decision to Withdrawn when a participant withdraws a pre-decision application', async () => {
    await insertRegistration({ role: 'Participant', decision: null });

    await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(await getDecision('reg-1')).toBe('Withdrawn');
  });

  test('leaves the decision untouched when dropping out post-decision', async () => {
    await insertRegistration({ role: 'Participant', decision: 'Accept' });

    await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(await getDecision('reg-1')).toBe('Accept');
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
});
