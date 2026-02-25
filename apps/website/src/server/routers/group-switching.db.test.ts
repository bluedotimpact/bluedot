import { describe, expect, test } from 'vitest';
import {
  courseTable,
  courseRegistrationTable,
  meetPersonTable,
  roundTable,
  groupTable,
  groupDiscussionTable,
  courseRunnerBucketTable,
  groupSwitchingTable,
} from '@bluedot/db';
import { setupDbTests, createCaller, testDb } from '../../__tests__/dbTestUtils';

setupDbTests();

const futureTimeSecs = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
const farFutureTimeSecs = futureTimeSecs + 60 * 60;
const pastTimeSecs = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
const farPastTimeSecs = pastTimeSecs - 60 * 60;

/**
 * Seeds the minimum data chain for group switching:
 * course → registration → meetPerson → round → bucket → groups → discussions
 */
async function seedCourseWithGroups() {
  await testDb.insert(courseTable, {
    id: 'course-1',
    slug: 'test-course',
    title: 'Test Course',
    description: 'A test course',
    shortDescription: 'Test',
    path: '/courses/test-course',
    units: ['unit-1', 'unit-2'],
  });

  await testDb.insert(roundTable, {
    id: 'round-1',
    title: 'Round 1',
    course: 'course-1',
    maxParticipantsPerGroup: 5,
  });

  await testDb.insert(courseRegistrationTable, {
    id: 'reg-1',
    email: 'test@example.com',
    courseId: 'course-1',
    decision: 'Accept',
  });

  await testDb.insert(meetPersonTable, {
    id: 'participant-1',
    applicationsBaseRecordId: 'reg-1',
    round: 'round-1',
    role: 'Participant',
    buckets: ['bucket-1'],
  });

  await testDb.insert(groupTable, {
    id: 'group-a',
    groupName: 'Group A',
    round: 'round-1',
    participants: ['participant-1', 'other-participant'],
  });

  await testDb.insert(groupTable, {
    id: 'group-b',
    groupName: 'Group B',
    round: 'round-1',
    participants: ['other-participant-2'],
  });

  await testDb.insert(courseRunnerBucketTable, {
    id: 'bucket-1',
    round: 'round-1',
    groups: ['group-a', 'group-b'],
  });

  await testDb.insert(groupDiscussionTable, {
    id: 'disc-a1',
    group: 'group-a',
    unitNumber: 1,
    unit: 'unit-1',
    startDateTime: futureTimeSecs,
    endDateTime: farFutureTimeSecs,
    facilitators: ['facilitator-1'],
    participantsExpected: ['participant-1', 'other-participant'],
  });

  await testDb.insert(groupDiscussionTable, {
    id: 'disc-b1',
    group: 'group-b',
    unitNumber: 1,
    unit: 'unit-1',
    startDateTime: futureTimeSecs,
    endDateTime: farFutureTimeSecs,
    facilitators: ['facilitator-2'],
    participantsExpected: ['other-participant-2'],
  });
}

describe('groupSwitching.discussionsAvailable', () => {
  test('returns available groups and discussions for the participant', async () => {
    await seedCourseWithGroups();

    const caller = createCaller();
    const result = await caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' });

    expect(result.groupsAvailable).toHaveLength(2);

    const groupA = result.groupsAvailable.find((g) => g.userIsParticipant);
    const groupB = result.groupsAvailable.find((g) => !g.userIsParticipant);

    expect(groupA).toBeDefined();
    // 5 max - 1 other participant = 4 spots
    expect(groupA!.spotsLeftIfKnown).toBe(4);

    expect(groupB).toBeDefined();
    // 5 max - 1 participant = 4 spots
    expect(groupB!.spotsLeftIfKnown).toBe(4);

    // Unit 1 has discussions from both groups
    expect(result.discussionsAvailable['1']).toHaveLength(2);

    // Verify participant flags on discussion level
    const myDisc = result.discussionsAvailable['1']!.find((d) => d.discussion.participantsExpected.includes('participant-1'));
    expect(myDisc!.userIsParticipant).toBe(true);
    expect(myDisc!.groupName).toBe('Group A');
  });

  test('throws NOT_FOUND for non-existent course', async () => {
    const caller = createCaller();
    await expect(caller.groupSwitching.discussionsAvailable({ courseSlug: 'nonexistent' }))
      .rejects.toThrow('No course with slug nonexistent found');
  });

  test('throws NOT_FOUND when user has no registration', async () => {
    await testDb.insert(courseTable, {
      slug: 'test-course',
      title: 'Test',
      description: 'Test',
      shortDescription: 'Test',
      path: '/test',
      units: [],
    });

    const caller = createCaller();
    await expect(caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' }))
      .rejects.toThrow('No course registration found');
  });

  test('excludes past discussions from availability', async () => {
    await seedCourseWithGroups();

    // Add a past discussion to group A for unit 2
    await testDb.insert(groupDiscussionTable, {
      group: 'group-a',
      unitNumber: 2,
      unit: 'unit-2',
      startDateTime: farPastTimeSecs,
      endDateTime: pastTimeSecs,
      facilitators: ['facilitator-1'],
      participantsExpected: ['participant-1'],
    });

    const caller = createCaller();
    const result = await caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' });

    // Unit 2 should only show the past discussion if user is participant
    // (calculateGroupAvailability keeps past discussions where userIsParticipant)
    const unit2 = result.discussionsAvailable['2'] ?? [];
    expect(unit2).toHaveLength(1);
    expect(unit2[0]!.userIsParticipant).toBe(true);
  });

  test('only shows groups within the participant bucket', async () => {
    await seedCourseWithGroups();

    // Add a group NOT in the participant's bucket
    await testDb.insert(groupTable, {
      id: 'group-c',
      groupName: 'Group C (different bucket)',
      round: 'round-1',
      participants: ['someone-else'],
    });

    await testDb.insert(groupDiscussionTable, {
      group: 'group-c',
      unitNumber: 1,
      unit: 'unit-1',
      startDateTime: futureTimeSecs,
      endDateTime: farFutureTimeSecs,
      facilitators: ['facilitator-3'],
      participantsExpected: ['someone-else'],
    });

    const caller = createCaller();
    const result = await caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' });

    // Should still only see 2 groups (A and B), not group C
    expect(result.groupsAvailable).toHaveLength(2);
    expect(result.groupsAvailable.every((g) => g.group.id !== 'group-c')).toBe(true);
  });

  test('works when participant has no buckets (only shows groups they are already in)', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'test-course',
      title: 'Test',
      description: 'Test',
      shortDescription: 'Test',
      path: '/test',
      units: [],
    });

    await testDb.insert(roundTable, {
      id: 'round-1',
      title: 'Round 1',
      course: 'course-1',
      maxParticipantsPerGroup: 5,
    });

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: 'test@example.com',
      courseId: 'course-1',
      decision: 'Accept',
    });

    await testDb.insert(meetPersonTable, {
      id: 'participant-1',
      applicationsBaseRecordId: 'reg-1',
      round: 'round-1',
      role: 'Participant',
      // No buckets
    });

    await testDb.insert(groupTable, {
      id: 'my-group',
      groupName: 'My Group',
      round: 'round-1',
      participants: ['participant-1'],
    });

    await testDb.insert(groupTable, {
      id: 'other-group',
      groupName: 'Other Group',
      round: 'round-1',
      participants: ['someone-else'],
    });

    await testDb.insert(groupDiscussionTable, {
      group: 'my-group',
      unitNumber: 1,
      unit: 'unit-1',
      startDateTime: futureTimeSecs,
      endDateTime: farFutureTimeSecs,
      facilitators: ['fac-1'],
      participantsExpected: ['participant-1'],
    });

    await testDb.insert(groupDiscussionTable, {
      group: 'other-group',
      unitNumber: 1,
      unit: 'unit-1',
      startDateTime: futureTimeSecs,
      endDateTime: farFutureTimeSecs,
      facilitators: ['fac-2'],
      participantsExpected: ['someone-else'],
    });

    const caller = createCaller();
    const result = await caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' });

    // Without buckets, only the group the participant is already in should show
    expect(result.groupsAvailable).toHaveLength(1);
    expect(result.groupsAvailable[0]!.group.id).toBe('my-group');
  });

  test('returns null spotsLeftIfKnown when round has no max', async () => {
    await seedCourseWithGroups();

    // Remove max participants from round
    await testDb.update(roundTable, {
      id: 'round-1',
      maxParticipantsPerGroup: null,
    });

    const caller = createCaller();
    const result = await caller.groupSwitching.discussionsAvailable({ courseSlug: 'test-course' });

    expect(result.groupsAvailable[0]!.spotsLeftIfKnown).toBeNull();
  });
});

describe('groupSwitching.switchGroup', () => {
  test('creates a permanent group switch request', async () => {
    await seedCourseWithGroups();

    const caller = createCaller();
    const result = await caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      newGroupId: 'group-b',
      isManualRequest: false,
      courseSlug: 'test-course',
    });

    expect(result).toBeNull();

    // Verify the switch record was created in the DB
    const switches = await testDb.scan(groupSwitchingTable);
    expect(switches).toHaveLength(1);
    expect(switches[0]).toMatchObject({
      oldGroup: 'group-a',
      newGroup: 'group-b',
      switchType: 'Switch group permanently',
      requestStatus: 'Requested',
      manualRequest: false,
    });
  });

  test('creates a temporary (one unit) switch request', async () => {
    await seedCourseWithGroups();

    const caller = createCaller();
    await caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      newDiscussionId: 'disc-b1',
      isManualRequest: false,
      courseSlug: 'test-course',
    });

    const switches = await testDb.scan(groupSwitchingTable);
    expect(switches).toHaveLength(1);
    expect(switches[0]).toMatchObject({
      switchType: 'Switch group for one unit',
      oldDiscussion: ['disc-a1'],
      newDiscussion: ['disc-b1'],
      unit: 'unit-1',
      requestStatus: 'Requested',
    });
  });

  test('creates a manual switch request (no new group required)', async () => {
    await seedCourseWithGroups();

    const caller = createCaller();
    await caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      isManualRequest: true,
      courseSlug: 'test-course',
      notesFromParticipant: 'Please move me to a different group',
    });

    const switches = await testDb.scan(groupSwitchingTable);
    expect(switches).toHaveLength(1);
    expect(switches[0]).toMatchObject({
      requestStatus: 'Resolve',
      manualRequest: true,
      notesFromParticipant: 'Please move me to a different group',
      newGroup: null,
    });
  });

  test('rejects if user is not in the old group', async () => {
    await seedCourseWithGroups();

    // group-b doesn't contain participant-1
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-b',
      newGroupId: 'group-b',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('User is not a member of old group');
  });

  test('rejects if user is already in the new group', async () => {
    await seedCourseWithGroups();

    // Try switching to group-a where participant already is
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      newGroupId: 'group-a',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('User is already a member of new group');
  });

  test('rejects if new group is full', async () => {
    await seedCourseWithGroups();

    // Set max to 1 and group-b already has 1 participant
    await testDb.update(roundTable, {
      id: 'round-1',
      maxParticipantsPerGroup: 1,
    });

    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      newGroupId: 'group-b',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('no spots remaining');
  });

  test('rejects if facilitator tries to switch', async () => {
    await seedCourseWithGroups();

    // Make participant a facilitator on a discussion in group-a
    await testDb.insert(groupDiscussionTable, {
      group: 'group-a',
      unitNumber: 2,
      unit: 'unit-2',
      startDateTime: futureTimeSecs,
      endDateTime: farFutureTimeSecs,
      facilitators: ['participant-1'],
      participantsExpected: ['participant-1'],
    });

    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      newGroupId: 'group-b',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('Facilitators cannot switch groups');
  });

  test('rejects temporary switch if old and new discussions are different units', async () => {
    await seedCourseWithGroups();

    // Create a unit-2 discussion in group-b
    await testDb.insert(groupDiscussionTable, {
      id: 'disc-b2',
      group: 'group-b',
      unitNumber: 2,
      unit: 'unit-2',
      startDateTime: futureTimeSecs,
      endDateTime: farFutureTimeSecs,
      facilitators: ['facilitator-2'],
      participantsExpected: [],
    });

    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      newDiscussionId: 'disc-b2',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('same course unit');
  });

  test('requires oldDiscussionId for temporary switch', async () => {
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      newDiscussionId: 'disc-b1',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('oldDiscussionId is required');
  });

  test('requires newGroupId for permanent switch (non-manual)', async () => {
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group permanently',
      oldGroupId: 'group-a',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('newGroupId is required');
  });

  test('rejects if user is not in the old discussion (temporary switch)', async () => {
    await seedCourseWithGroups();

    // disc-b1 has participantsExpected: ['other-participant-2'], not our participant
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-b1',
      newDiscussionId: 'disc-b1',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('User not found in old discussion');
  });

  test('rejects if user is already in new discussion (temporary switch)', async () => {
    await seedCourseWithGroups();

    // disc-a1 already has our participant
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      newDiscussionId: 'disc-a1',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('already expected to attend');
  });

  test('rejects temporary switch if discussion is full', async () => {
    await seedCourseWithGroups();

    await testDb.update(roundTable, {
      id: 'round-1',
      maxParticipantsPerGroup: 1,
    });

    // disc-b1 has 1 participant and max is 1
    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      newDiscussionId: 'disc-b1',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('no spots remaining');
  });

  test('creates a manual temporary switch request (no newDiscussionId required)', async () => {
    await seedCourseWithGroups();

    const caller = createCaller();
    await caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      isManualRequest: true,
      courseSlug: 'test-course',
      notesFromParticipant: 'Cannot make my usual time',
    });

    const switches = await testDb.scan(groupSwitchingTable);
    expect(switches).toHaveLength(1);
    expect(switches[0]).toMatchObject({
      switchType: 'Switch group for one unit',
      requestStatus: 'Resolve',
      manualRequest: true,
      oldDiscussion: ['disc-a1'],
      newDiscussion: [],
      newGroup: null,
    });
  });

  test('rejects facilitator on temporary switch', async () => {
    await seedCourseWithGroups();

    // Make participant a facilitator on disc-a1
    await testDb.update(groupDiscussionTable, {
      id: 'disc-a1',
      facilitators: ['participant-1'],
    });

    const caller = createCaller();
    await expect(caller.groupSwitching.switchGroup({
      switchType: 'Switch group for one unit',
      oldDiscussionId: 'disc-a1',
      newDiscussionId: 'disc-b1',
      isManualRequest: false,
      courseSlug: 'test-course',
    })).rejects.toThrow('Facilitators cannot switch groups');
  });
});
