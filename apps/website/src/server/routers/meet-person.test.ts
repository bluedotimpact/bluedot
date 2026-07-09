import { groupTable, meetPersonTable } from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller,
  seedLoggedInUser,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();
beforeEach(seedLoggedInUser);

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

describe('meetPerson.getGroupParticipants', () => {
  test('throws NOT_FOUND when the group does not exist', async () => {
    await expect(caller.meetPerson.getGroupParticipants({ groupId: 'group-does-not-exist' }))
      .rejects.toThrow('group not found');
  });

  test('throws NOT_FOUND when caller is not a member of the group', async () => {
    await testDb.insert(meetPersonTable, {
      id: 'mp-someone-else',
      email: 'someone-else@example.com',
      applicationsBaseRecordId: 'reg-someone-else',
      round: 'round-1',
      role: 'Participant',
    });
    await testDb.insert(groupTable, {
      id: 'group-not-mine',
      groupName: 'Not mine',
      round: 'round-1',
      participants: ['mp-someone-else'],
      facilitator: [],
    });

    await expect(caller.meetPerson.getGroupParticipants({ groupId: 'group-not-mine' }))
      .rejects.toThrow('group not found');
  });

  test('returns facilitators + co-participants, sorted alphabetically, excluding the caller (participant caller)', async () => {
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

    const result = await caller.meetPerson.getGroupParticipants({ groupId: 'group-1' });

    expect(result.facilitators.map((p) => p.name)).toEqual(['Alice Facilitator', 'Zara Facilitator']);
    expect(result.participants.map((p) => p.name)).toEqual(['Bob Participant', 'Yara Participant']);
  });

  test('authorizes facilitator caller via group.facilitator membership', async () => {
    await testDb.insert(meetPersonTable, {
      id: 'mp-me-fac',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-me-fac',
      round: 'round-1',
      role: 'Facilitator',
      // No groupsAsParticipant
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-p-bob', email: 'bob@example.com', applicationsBaseRecordId: 'reg-p-bob', round: 'round-1', role: 'Participant', name: 'Bob Participant',
    });

    await testDb.insert(groupTable, {
      id: 'group-fac',
      groupName: 'Facilitated Group',
      round: 'round-1',
      participants: ['mp-p-bob'],
      facilitator: ['mp-me-fac'],
    });

    const result = await caller.meetPerson.getGroupParticipants({ groupId: 'group-fac' });

    expect(result.facilitators).toEqual([]);
    expect(result.participants.map((p) => p.name)).toEqual(['Bob Participant']);
  });
});
