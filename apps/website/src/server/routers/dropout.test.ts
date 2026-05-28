import { courseRegistrationTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const insertRegistration = (overrides: Record<string, unknown>) => testDb.insert(courseRegistrationTable, {
  id: 'reg-1',
  email: 'test@example.com',
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

  test('lets a facilitator withdraw before acceptance (decision = null)', async () => {
    await insertRegistration({ role: 'Facilitator', decision: null });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Drop out',
    });
    expect(result).toBeTruthy();
  });

  test('lets a participant defer', async () => {
    await insertRegistration({ role: 'Participant' });

    const result = await createCaller(testAuthContextLoggedIn).dropout.dropoutOrDeferral({
      applicantId: 'reg-1', type: 'Deferral', newRoundId: 'round-2',
    });
    expect(result).toBeTruthy();
  });
});
