import { groupTable, meetPersonTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

describe('meetPerson.getGroupParticipants', () => {
  test('throws NOT_FOUND when meetPersonId belongs to a different user', async () => {
    await testDb.insert(meetPersonTable, {
      id: 'mp-someone-else',
      email: 'someone-else@example.com',
      applicationsBaseRecordId: 'reg-someone-else',
      round: 'round-1',
      role: 'Participant',
    });

    await expect(caller.meetPerson.getGroupParticipants({ meetPersonId: 'mp-someone-else' }))
      .rejects.toThrow('meetPerson not found');

    // Same error for a meetPersonId that doesn't exist at all — the authz check covers both.
    await expect(caller.meetPerson.getGroupParticipants({ meetPersonId: 'mp-does-not-exist' }))
      .rejects.toThrow('meetPerson not found');
  });

  test('returns facilitators + co-participants, sorted alphabetically, excluding the caller', async () => {
    await testDb.insert(meetPersonTable, {
      id: 'mp-me',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-me',
      round: 'round-1',
      role: 'Participant',
      groupsAsParticipant: ['group-1'],
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-fac-zara', email: 'zara-fac@example.com', applicationsBaseRecordId: 'reg-fac-zara', round: 'round-1', role: 'Facilitator', name: 'Zara Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-fac-alice', email: 'alice-fac@example.com', applicationsBaseRecordId: 'reg-fac-alice', round: 'round-1', role: 'Facilitator', name: 'Alice Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-p-bob', email: 'bob@example.com', applicationsBaseRecordId: 'reg-p-bob', round: 'round-1', role: 'Participant', name: 'Bob Participant',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-p-yara', email: 'yara@example.com', applicationsBaseRecordId: 'reg-p-yara', round: 'round-1', role: 'Participant', name: 'Yara Participant',
    });

    await testDb.insert(groupTable, {
      id: 'group-1',
      groupName: 'My Group',
      round: 'round-1',
      participants: ['mp-me', 'mp-p-yara', 'mp-p-bob'],
      facilitator: ['mp-fac-zara', 'mp-fac-alice'],
    });

    const result = await caller.meetPerson.getGroupParticipants({ meetPersonId: 'mp-me' });

    expect(result.facilitators.map((p) => p.name)).toEqual(['Alice Facilitator', 'Zara Facilitator']);
    expect(result.participants.map((p) => p.name)).toEqual(['Bob Participant', 'Yara Participant']);
  });

  test('returns empty lists when the caller has no group', async () => {
    await testDb.insert(meetPersonTable, {
      id: 'mp-me',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-me',
      round: 'round-1',
      role: 'Participant',
      // No groupsAsParticipant
    });

    const result = await caller.meetPerson.getGroupParticipants({ meetPersonId: 'mp-me' });

    expect(result).toEqual({ facilitators: [], participants: [] });
  });
});
