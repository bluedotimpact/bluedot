import {
  courseFeedbackTable,
  courseRegistrationTable,
  courseTable,
  facilitatorDiscussionSwitchingTable,
  groupDiscussionTable,
  groupTable,
  meetPersonTable,
  peerFeedbackTable,
  roundTable,
  unitTable,
  userTable,
} from '@bluedot/db';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import env from '../../lib/api/env';

vi.mock('../airtableFieldOptions', () => ({
  getFieldOptions: vi.fn().mockResolvedValue([
    { id: 'sel1', name: 'No further action needed' },
    { id: 'sel2', name: 'Add to talent pipeline [keep warm for future opportunities/check-ins]' },
    { id: 'sel3', name: '[!] Flag for 1-1 advising with BlueDot team' },
    { id: 'sel4', name: '[!] Flag as candidate for funding (career transition/project)' },
    { id: 'sel5', name: '[!] Recommend to facilitate' },
  ]),
}));

setupTestDb();
beforeEach(seedLoggedInUser);

const FACILITATOR_ID = 'facilitator-1';
const PARTICIPANT_1 = 'participant-1';
const PARTICIPANT_2 = 'participant-2';
const OUTSIDER = 'outsider-1';
const DROP_IN = 'drop-in-1';
const ROUND_ID = 'round-1';
const GROUP_ID = 'group-1';
const DISCUSSION_ID = 'discussion-1';
const GROUP_2_ID = 'group-2';
const PARTICIPANT_3 = 'participant-3';
const DROP_IN_2 = 'drop-in-2';
const DISCUSSION_2_ID = 'discussion-2';

async function seedFacilitatorGroup() {
  await testDb.insert(courseTable, {
    id: 'course-1',
    slug: 'test-course',
    title: 'Test',
    shortDescription: 'Test',
    units: [],
  });
  await testDb.insert(roundTable, {
    id: ROUND_ID,
    title: 'Round 1',
    course: 'course-1',
  });
  await testDb.insert(meetPersonTable, {
    id: FACILITATOR_ID,
    userId: 'test-user',
    round: ROUND_ID,
    role: 'Facilitator',
  });
  await testDb.insert(meetPersonTable, {
    id: PARTICIPANT_1,
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: PARTICIPANT_2,
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: OUTSIDER,
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(groupTable, {
    id: GROUP_ID,
    groupName: 'Group 1',
    round: ROUND_ID,
    facilitator: [FACILITATOR_ID],
    participants: [PARTICIPANT_1, PARTICIPANT_2],
  });
}

// A second group facilitated by the same meetPerson within the same round.
async function seedSecondGroup() {
  await testDb.insert(meetPersonTable, {
    id: PARTICIPANT_3,
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(groupTable, {
    id: GROUP_2_ID,
    groupName: 'Group 2',
    round: ROUND_ID,
    facilitator: [FACILITATOR_ID],
    participants: [PARTICIPANT_3],
  });
}

async function seedDropIn() {
  await testDb.insert(meetPersonTable, {
    id: DROP_IN,
    name: 'Drop In',
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(groupDiscussionTable, {
    id: DISCUSSION_ID,
    group: GROUP_ID,
    facilitators: [FACILITATOR_ID],
    participantsExpected: [PARTICIPANT_1, PARTICIPANT_2],
    attendees: [PARTICIPANT_1, DROP_IN],
    startDateTime: 1000,
    endDateTime: 2000,
  });
}

const baseInput = {
  meetPersonId: FACILITATOR_ID,
  participantId: PARTICIPANT_1,
  initiativeRating: 4,
  reasoningQualityRating: 5,
  feedback: 'Great work',
  nextSteps: ['[!] Recommend to facilitate' as const],
};

describe('facilitators.savePeerFeedback', () => {
  const caller = createCaller(testAuthContextLoggedIn);

  test('creates course_feedback stub and peer_feedback on first save', async () => {
    await seedFacilitatorGroup();

    await caller.facilitators.savePeerFeedback(baseInput);

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]).toMatchObject({
      person: [FACILITATOR_ID],
      round: [ROUND_ID],
    });

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(1);
    expect(pfs[0]).toMatchObject({
      feedbackRecipient: [PARTICIPANT_1],
      courseFeedback: [cfs[0]!.id],
      initiativeRating: 4,
      reasoningQualityRating: 5,
      feedback: 'Great work',
      nextSteps: ['[!] Recommend to facilitate'],
    });
  });

  test('second save for same participant updates in place (upsert)', async () => {
    await seedFacilitatorGroup();

    await caller.facilitators.savePeerFeedback(baseInput);
    await caller.facilitators.savePeerFeedback({
      ...baseInput,
      feedback: 'Updated',
      initiativeRating: 5,
      nextSteps: [],
    });

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(1);
    expect(pfs[0]).toMatchObject({
      feedbackRecipient: [PARTICIPANT_1],
      feedback: 'Updated',
      initiativeRating: 5,
      nextSteps: [],
    });

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
  });

  test('different participants get separate peer_feedback, sharing one course_feedback', async () => {
    await seedFacilitatorGroup();

    await caller.facilitators.savePeerFeedback({ ...baseInput, participantId: PARTICIPANT_1, feedback: 'P1' });
    await caller.facilitators.savePeerFeedback({ ...baseInput, participantId: PARTICIPANT_2, feedback: 'P2' });

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(2);
    const byRecipient = new Map(pfs.map((p) => [p.feedbackRecipient?.[0], p.feedback]));
    expect(byRecipient.get(PARTICIPANT_1)).toBe('P1');
    expect(byRecipient.get(PARTICIPANT_2)).toBe('P2');
  });

  test('reuses existing course_feedback instead of creating a new one', async () => {
    await seedFacilitatorGroup();
    const existing = await testDb.insert(courseFeedbackTable, {
      person: [FACILITATOR_ID],
      round: [ROUND_ID],
    });
    await testDb.update(meetPersonTable, {
      id: FACILITATOR_ID,
      courseFeedback: [existing.id],
    });

    await caller.facilitators.savePeerFeedback(baseInput);

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]!.id).toBe(existing.id);

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs[0]!.courseFeedback).toEqual([existing.id]);
  });

  test('allows feedback for a same-round Participant outside the facilitator\'s group (manually added)', async () => {
    await seedFacilitatorGroup();

    await caller.facilitators.savePeerFeedback({ ...baseInput, participantId: OUTSIDER });

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(1);
    expect(pfs[0]!.feedbackRecipient).toEqual([OUTSIDER]);
  });

  test('rejects participantId from a different round', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-round-participant',
      round: 'different-round',
      role: 'Participant',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      participantId: 'other-round-participant',
    })).rejects.toThrow('Participant is not in your round');
  });

  test('allows feedback for a participant of another round\'s group the facilitator substituted in', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-round-participant',
      round: 'different-round',
      role: 'Participant',
    });
    await testDb.insert(groupTable, {
      id: 'other-round-group',
      groupName: 'Other Round Group',
      round: 'different-round',
      facilitator: ['someone-else'],
      participants: ['other-round-participant'],
    });
    await testDb.insert(groupDiscussionTable, {
      id: 'other-round-discussion',
      group: 'other-round-group',
      facilitators: [FACILITATOR_ID],
      startDateTime: 1000,
      endDateTime: 2000,
    });
    await testDb.update(meetPersonTable, { id: FACILITATOR_ID, attendedDiscussions: ['other-round-discussion'] });

    await caller.facilitators.savePeerFeedback({ ...baseInput, participantId: 'other-round-participant' });

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(1);
    expect(pfs[0]!.feedbackRecipient).toEqual(['other-round-participant']);
  });

  test('rejects a Facilitator as a feedback recipient', async () => {
    await seedFacilitatorGroup();

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      participantId: FACILITATOR_ID,
    })).rejects.toThrow('Participant is not in your round');
  });

  test('allows feedback for a drop-in (attendee of a group discussion, not a listed participant)', async () => {
    await seedFacilitatorGroup();
    await seedDropIn();

    await caller.facilitators.savePeerFeedback({ ...baseInput, participantId: DROP_IN });

    const pfs = await testDb.scan(peerFeedbackTable);
    expect(pfs).toHaveLength(1);
    expect(pfs[0]!.feedbackRecipient).toEqual([DROP_IN]);
  });

  test('rejects meetPersonId that belongs to a Participant, not a Facilitator', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'participant-self',
      userId: 'test-user',
      round: ROUND_ID,
      role: 'Participant',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      meetPersonId: 'participant-self',
    })).rejects.toThrow('Not found');
  });

  test('rejects meetPersonId that belongs to a different user', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-facilitator',
      userId: 'user-other',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      meetPersonId: 'other-facilitator',
    })).rejects.toThrow('Not found');
  });

  test('rejects meetPersonId that matches by email but is not linked by userId', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'unlinked-facilitator',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      meetPersonId: 'unlinked-facilitator',
    })).rejects.toThrow('Not found');
  });
});

describe('facilitators.getFeedbackFormData', () => {
  const caller = createCaller(testAuthContextLoggedIn);

  test('returns existing course and peer feedback after saves', async () => {
    await seedFacilitatorGroup();
    await caller.facilitators.savePeerFeedback(baseInput);
    await caller.facilitators.submitFeedback({
      meetPersonId: FACILITATOR_ID,
      courseRating: 5,
      courseValue: 'Great course',
      improvements: 'None',
    });

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.email).toBe('test@example.com');
    expect(result.groupIds).toEqual([GROUP_ID]);
    expect(result.participants.map((p) => p.id).sort()).toEqual([PARTICIPANT_1, PARTICIPANT_2].sort());
    expect(result.dropIns).toEqual([]);
    expect(result.existingCourseFeedback).toMatchObject({
      courseRating: 5,
      courseValue: 'Great course',
      improvements: 'None',
    });
    expect(result.existingCourseFeedback?.completed).toBe(true);
    expect(result.existingPeerFeedback).toHaveLength(1);
    expect(result.existingPeerFeedback[0]).toMatchObject({
      recipientId: PARTICIPANT_1,
      initiativeRating: 4,
      reasoningQualityRating: 5,
      feedback: 'Great work',
    });
  });

  test('rejects meetPersonId that belongs to a different user', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-facilitator',
      userId: 'user-other',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    await expect(caller.facilitators.getFeedbackFormData({ meetPersonId: 'other-facilitator' }))
      .rejects.toThrow('Not found');
  });

  test('allows an admin (not impersonating) to access another facilitator\'s form', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });
    const adminCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, sub: 'admin-sub' },
    });

    const result = await adminCaller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });
    expect(result.meetPersonId).toBe(FACILITATOR_ID);
  });

  test('rejects an admin impersonating a user who is not the facilitator', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });
    await testDb.insert(userTable, {
      id: 'user-other', email: 'other@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });
    const impersonatingCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, sub: 'other-sub' },
      impersonation: { adminEmail: 'admin@example.com', adminSub: 'admin-sub', targetEmail: 'other@example.com' },
    });

    await expect(impersonatingCaller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID }))
      .rejects.toThrow('Not found');
  });

  test('errors when the facilitator meetPerson has no linked user', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });
    await testDb.insert(meetPersonTable, {
      id: 'unlinked-facilitator',
      round: ROUND_ID,
      role: 'Facilitator',
    });
    await testDb.insert(groupTable, {
      id: 'unlinked-group',
      groupName: 'Unlinked Group',
      round: ROUND_ID,
      facilitator: ['unlinked-facilitator'],
      participants: [PARTICIPANT_1],
    });
    const adminCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, sub: 'admin-sub' },
    });

    await expect(adminCaller.facilitators.getFeedbackFormData({ meetPersonId: 'unlinked-facilitator' }))
      .rejects.toThrow('Facilitator has no linked user');
  });

  test('a facilitator whose group was handed to someone else can still open the form via attended discussions', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, { id: 'facilitator-2', round: ROUND_ID, role: 'Facilitator' });
    await testDb.update(groupTable, { id: GROUP_ID, facilitator: ['facilitator-2'] });
    await testDb.insert(groupDiscussionTable, {
      id: DISCUSSION_ID,
      group: GROUP_ID,
      facilitators: [FACILITATOR_ID],
      participantsExpected: [PARTICIPANT_1, PARTICIPANT_2],
      attendees: [FACILITATOR_ID, PARTICIPANT_1],
      startDateTime: 1000,
      endDateTime: 2000,
    });
    await testDb.update(meetPersonTable, { id: FACILITATOR_ID, attendedDiscussions: [DISCUSSION_ID] });

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.groupIds).toEqual([GROUP_ID]);
    expect(result.participants.map((p) => p.id).sort()).toEqual([PARTICIPANT_1, PARTICIPANT_2].sort());
    expect(result.dropIns).toEqual([]);
  });

  test('rejects a facilitator with no current group and no attended discussions', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, { id: 'facilitator-2', round: ROUND_ID, role: 'Facilitator' });
    await testDb.update(groupTable, { id: GROUP_ID, facilitator: ['facilitator-2'] });

    await expect(caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID }))
      .rejects.toThrow('No group found for this facilitator');
  });

  test('returns drop-ins (attendees not in group.participants)', async () => {
    await seedFacilitatorGroup();
    await seedDropIn();

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.participants.map((p) => p.id).sort()).toEqual([PARTICIPANT_1, PARTICIPANT_2].sort());
    expect(result.dropIns).toEqual([{ id: DROP_IN, name: 'Drop In' }]);
  });

  test('aggregates participants across all groups the facilitator runs, in group order', async () => {
    await seedFacilitatorGroup();
    await seedSecondGroup();

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.groupIds.sort()).toEqual([GROUP_ID, GROUP_2_ID].sort());
    // Group 1's participants come before group 2's.
    expect(result.participants.map((p) => p.id)).toEqual([PARTICIPANT_1, PARTICIPANT_2, PARTICIPANT_3]);
  });

  test('aggregates drop-ins across all groups the facilitator runs', async () => {
    await seedFacilitatorGroup();
    await seedSecondGroup();
    await seedDropIn();
    await testDb.insert(meetPersonTable, {
      id: DROP_IN_2,
      name: 'Drop In Two',
      round: ROUND_ID,
      role: 'Participant',
    });
    await testDb.insert(groupDiscussionTable, {
      id: DISCUSSION_2_ID,
      group: GROUP_2_ID,
      facilitators: [FACILITATOR_ID],
      participantsExpected: [PARTICIPANT_3],
      attendees: [PARTICIPANT_3, DROP_IN_2],
      startDateTime: 1000,
      endDateTime: 2000,
    });

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.dropIns.map((p) => p.id).sort()).toEqual([DROP_IN, DROP_IN_2].sort());
  });

  test('excludes facilitators from drop-ins (self and co-facilitators)', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'co-facilitator',
      name: 'Co Facilitator',
      round: ROUND_ID,
      role: 'Facilitator',
    });
    await testDb.insert(groupDiscussionTable, {
      id: DISCUSSION_ID,
      group: GROUP_ID,
      facilitators: [FACILITATOR_ID],
      participantsExpected: [PARTICIPANT_1, PARTICIPANT_2],
      // Discussion had both facilitators attending, plus a real drop-in participant
      attendees: [FACILITATOR_ID, 'co-facilitator', PARTICIPANT_1],
      startDateTime: 1000,
      endDateTime: 2000,
    });

    const result = await caller.facilitators.getFeedbackFormData({ meetPersonId: FACILITATOR_ID });

    expect(result.dropIns).toEqual([]);
  });
});

describe('facilitators.searchAddableParticipants', () => {
  const caller = createCaller(testAuthContextLoggedIn);

  test('returns same-round Participants excluding group members, drop-ins, and facilitators', async () => {
    await seedFacilitatorGroup();
    await seedDropIn();
    await testDb.insert(meetPersonTable, {
      id: 'co-facilitator',
      name: 'Co Facilitator',
      round: ROUND_ID,
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: 'other-round-participant',
      name: 'Other Round',
      round: 'different-round',
      role: 'Participant',
    });
    await testDb.update(meetPersonTable, { id: OUTSIDER, name: 'Outside R. Group' });

    const result = await caller.facilitators.searchAddableParticipants({ meetPersonId: FACILITATOR_ID });

    expect(result.map((p) => p.id)).toEqual([OUTSIDER]);
  });

  test('excludes participants from all groups the facilitator runs', async () => {
    await seedFacilitatorGroup();
    await seedSecondGroup();
    await testDb.update(meetPersonTable, { id: OUTSIDER, name: 'Outside R. Group' });

    const result = await caller.facilitators.searchAddableParticipants({ meetPersonId: FACILITATOR_ID });

    // PARTICIPANT_3 (second group) is excluded; only the genuinely-unaffiliated OUTSIDER remains.
    expect(result.map((p) => p.id)).toEqual([OUTSIDER]);
  });

  test('filters by searchTerm (case-insensitive name match)', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'alice',
      name: 'Alice Adams',
      round: ROUND_ID,
      role: 'Participant',
    });
    await testDb.insert(meetPersonTable, {
      id: 'bob',
      name: 'Bob Baker',
      round: ROUND_ID,
      role: 'Participant',
    });

    const result = await caller.facilitators.searchAddableParticipants({ meetPersonId: FACILITATOR_ID, searchTerm: 'alice' });

    expect(result.map((p) => p.id)).toEqual(['alice']);
  });
});

describe('facilitators.getFacilitatorsForRound', () => {
  const caller = createCaller(testAuthContextLoggedIn);

  test('finds the caller\'s facilitator row by userId and lists the others', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-facilitator',
      name: 'Other Facilitator',
      userId: 'user-other',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    const result = await caller.facilitators.getFacilitatorsForRound({ roundId: ROUND_ID });

    expect(result).toEqual([{ value: 'other-facilitator', label: 'Other Facilitator' }]);
  });

  test('rejects when the caller\'s row matches by email but is not linked by userId', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'unlinked-facilitator',
      round: 'round-2',
      role: 'Facilitator',
    });

    await expect(caller.facilitators.getFacilitatorsForRound({ roundId: 'round-2' }))
      .rejects.toThrow('No facilitator found for this round');
  });
});

describe('facilitators.updateDiscussion', () => {
  const caller = createCaller(testAuthContextLoggedIn);
  const COVERED_GROUP_ID = 'group-covered';
  const COVERED_DISCUSSION_ID = 'discussion-covered';
  const requestedDateTimeInSeconds = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;

  async function seedSubstituteCover() {
    await seedFacilitatorGroup();
    await testDb.insert(groupTable, {
      id: COVERED_GROUP_ID,
      groupName: 'Covered group',
      round: ROUND_ID,
      facilitator: ['other-facilitator'],
      participants: [],
    });
    await testDb.insert(groupDiscussionTable, {
      id: COVERED_DISCUSSION_ID,
      group: COVERED_GROUP_ID,
      facilitators: [FACILITATOR_ID],
      participantsExpected: [],
      startDateTime: requestedDateTimeInSeconds - 24 * 60 * 60,
      endDateTime: requestedDateTimeInSeconds - 23 * 60 * 60,
    });
    await testDb.update(meetPersonTable, { id: FACILITATOR_ID, expectedDiscussionsFacilitator: [COVERED_DISCUSSION_ID] });
  }

  test('rejects a permanent time change from a substitute who is not the group\'s facilitator', async () => {
    await seedSubstituteCover();

    await expect(caller.facilitators.updateDiscussion({ roundId: ROUND_ID, groupId: COVERED_GROUP_ID, requestedDateTimeInSeconds }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await testDb.pg.select().from(facilitatorDiscussionSwitchingTable.pg)).toEqual([]);
  });

  test('lets the group\'s facilitator change its discussion time permanently', async () => {
    await seedSubstituteCover();
    await testDb.update(groupTable, { id: COVERED_GROUP_ID, facilitator: [FACILITATOR_ID] });

    await caller.facilitators.updateDiscussion({ roundId: ROUND_ID, groupId: COVERED_GROUP_ID, requestedDateTimeInSeconds });

    const requests = await testDb.pg.select().from(facilitatorDiscussionSwitchingTable.pg);
    expect(requests.map((r) => r.switchType)).toEqual(['Change permanently']);
  });

  test('still lets a substitute change the time of the one discussion they cover', async () => {
    await seedSubstituteCover();

    await caller.facilitators.updateDiscussion({
      roundId: ROUND_ID, discussionId: COVERED_DISCUSSION_ID, groupId: COVERED_GROUP_ID, requestedDateTimeInSeconds,
    });

    const requests = await testDb.pg.select().from(facilitatorDiscussionSwitchingTable.pg);
    expect(requests.map((r) => r.switchType)).toEqual(['Change for one unit']);
  });
});

describe('facilitators.submitFeedback', () => {
  const caller = createCaller(testAuthContextLoggedIn);

  const submitInput = {
    meetPersonId: FACILITATOR_ID,
    courseRating: 4,
    courseValue: 'Valuable',
    improvements: 'More exercises',
  };

  test('creates course_feedback stub and sets completed=true on first submit', async () => {
    await seedFacilitatorGroup();

    const { courseFeedbackId } = await caller.facilitators.submitFeedback(submitInput);

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]!.id).toBe(courseFeedbackId);
    expect(cfs[0]).toMatchObject({
      courseRating: 4,
      courseValue: 'Valuable',
      improvements: 'More exercises',
      completed: true,
    });
  });

  test('reuses existing course_feedback (e.g. stub from savePeerFeedback)', async () => {
    await seedFacilitatorGroup();
    await caller.facilitators.savePeerFeedback(baseInput);
    const [stub] = await testDb.scan(courseFeedbackTable);

    const { courseFeedbackId } = await caller.facilitators.submitFeedback(submitInput);

    expect(courseFeedbackId).toBe(stub!.id);
    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]!.completed).toBe(true);
  });

  test('rejects meetPersonId that belongs to a Participant', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'participant-self',
      userId: 'test-user',
      round: ROUND_ID,
      role: 'Participant',
    });

    await expect(caller.facilitators.submitFeedback({
      ...submitInput,
      meetPersonId: 'participant-self',
    })).rejects.toThrow('Not found');
  });
});

describe('facilitators cover requests', () => {
  const caller = createCaller(testAuthContextLoggedIn);
  const HOUR_SECONDS = 60 * 60;
  // Friday 23 Oct 2026, 07:00–09:00 UTC
  const startTimeSeconds = Date.UTC(2026, 9, 23, 7, 0) / 1000;
  const endTimeSeconds = startTimeSeconds + 2 * HOUR_SECONDS;
  const AVAILABLE = 'F06:00 F10:00';
  const UNAVAILABLE = 'M06:00 M10:00';
  const coverInput = { roundId: ROUND_ID, groupId: GROUP_ID, discussionId: DISCUSSION_ID };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.UTC(2026, 9, 20) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function seedCoverRequest() {
    await seedFacilitatorGroup();
    await testDb.update(meetPersonTable, {
      id: FACILITATOR_ID,
      name: 'Sam Rivera',
      slackProfileUrl: 'https://aisafetyfundamentals.slack.com/team/UREQUESTER',
      expectedDiscussionsFacilitator: [DISCUSSION_ID],
    });
    await testDb.update(groupTable, { id: GROUP_ID, groupName: 'Group 1 - Sam Rivera' });
    await testDb.insert(unitTable, {
      id: 'unit-4', unitNumber: '4', title: 'Unit 4', courseId: 'course-1', courseSlug: 'test-course',
    });
    await testDb.insert(groupDiscussionTable, {
      id: DISCUSSION_ID,
      group: GROUP_ID,
      facilitators: [FACILITATOR_ID],
      participantsExpected: [],
      startDateTime: startTimeSeconds,
      endDateTime: endTimeSeconds,
      courseBuilderUnitRecordId: 'unit-4',
    });
  }

  async function seedFacilitator(id: string, { round = ROUND_ID, availability = AVAILABLE as string | null, slack = true } = {}) {
    await testDb.insert(courseRegistrationTable, {
      id: `reg-${id}`,
      email: `${id}@example.com`,
      courseId: 'course-1',
      role: 'Facilitator',
      availabilityIntervalsUTC: availability,
    });
    await testDb.insert(meetPersonTable, {
      id,
      name: id,
      userId: `user-${id}`,
      round,
      role: 'Facilitator',
      applicationsBaseRecordId: `reg-${id}`,
      slackProfileUrl: slack ? `https://aisafetyfundamentals.slack.com/team/U${id.toUpperCase().replace(/-/g, '')}` : null,
    });
  }

  async function seedDiscussionFacilitatedBy(meetPersonId: string, { startOffsetSeconds }: { startOffsetSeconds: number }) {
    await testDb.insert(groupDiscussionTable, {
      id: `discussion-${meetPersonId}`,
      group: `group-${meetPersonId}`,
      facilitators: [meetPersonId],
      participantsExpected: [],
      startDateTime: startTimeSeconds + startOffsetSeconds,
      endDateTime: endTimeSeconds + startOffsetSeconds,
    });
  }

  const namesOf = (people: { name: string }[]) => people.map((p) => p.name).sort();

  test('splits same-round facilitators by availability, leaving out clashes and people without Slack', async () => {
    await seedCoverRequest();
    await seedFacilitator('free');
    await seedFacilitator('unavailable', { availability: UNAVAILABLE });
    await seedFacilitator('no-availability', { availability: null });
    await seedFacilitator('no-slack', { slack: false });
    await seedFacilitator('other-round', { round: 'round-2' });
    await seedFacilitator('clash');
    await seedDiscussionFacilitatedBy('clash', { startOffsetSeconds: HOUR_SECONDS });
    await seedFacilitator('back-to-back');
    await seedDiscussionFacilitatedBy('back-to-back', { startOffsetSeconds: -2 * HOUR_SECONDS });
    // Clashes under their meetPerson in another round
    await seedFacilitator('clash-elsewhere');
    await testDb.insert(meetPersonTable, {
      id: 'clash-elsewhere-round-2', userId: 'user-clash-elsewhere', round: 'round-2', role: 'Facilitator',
    });
    await seedDiscussionFacilitatedBy('clash-elsewhere-round-2', { startOffsetSeconds: -HOUR_SECONDS });

    const { messageDetails, taggedFacilitatorIds } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(messageDetails).toMatchObject({
      requester: { name: 'Sam Rivera', slackUserId: 'UREQUESTER' },
      courseTitle: 'Test',
      unitNumber: '4',
      groupName: 'Group 1 - Sam Rivera',
      startTimeSeconds,
      endTimeSeconds,
      moreFreeThanTagged: false,
    });
    expect(messageDetails.assignUrl).toMatch(/\/facilitated-courses\?changeFacilitator=discussion-1$/);
    expect(namesOf(messageDetails.freeFacilitators)).toEqual(['back-to-back', 'free']);
    expect(namesOf(messageDetails.noClashFacilitators)).toEqual(['no-availability', 'unavailable']);
    expect(messageDetails.freeFacilitators.find((f) => f.name === 'free')).toEqual({ name: 'free', slackUserId: 'UFREE' });
    expect(taggedFacilitatorIds.sort()).toEqual(['back-to-back', 'free', 'no-availability', 'unavailable']);
  });

  test('counts a clashing session with no end time, or one they take part in as a participant', async () => {
    await seedCoverRequest();
    await seedFacilitator('free');
    await seedFacilitator('clash-no-end');
    await testDb.insert(groupDiscussionTable, {
      id: 'discussion-no-end',
      group: 'group-no-end',
      facilitators: ['clash-no-end'],
      participantsExpected: [],
      startDateTime: startTimeSeconds + HOUR_SECONDS,
      endDateTime: null,
    });
    await seedFacilitator('earlier-no-end');
    await testDb.insert(groupDiscussionTable, {
      id: 'discussion-earlier-no-end',
      group: 'group-earlier-no-end',
      facilitators: ['earlier-no-end'],
      participantsExpected: [],
      startDateTime: startTimeSeconds - HOUR_SECONDS,
      endDateTime: null,
    });
    await seedFacilitator('studying');
    await testDb.insert(meetPersonTable, {
      id: 'studying-round-2', userId: 'user-studying', round: 'round-2', role: 'Participant',
    });
    await testDb.insert(groupDiscussionTable, {
      id: 'discussion-studying',
      group: 'group-studying',
      facilitators: ['someone-else'],
      participantsExpected: ['studying-round-2'],
      startDateTime: startTimeSeconds + HOUR_SECONDS,
      endDateTime: endTimeSeconds + HOUR_SECONDS,
    });

    const { messageDetails } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(namesOf(messageDetails.freeFacilitators)).toEqual(['earlier-no-end', 'free']);
    expect(messageDetails.noClashFacilitators).toEqual([]);
  });

  test('leaves out facilitators who have withdrawn', async () => {
    await seedCoverRequest();
    await seedFacilitator('free');
    await seedFacilitator('withdrawn');
    await testDb.update(courseRegistrationTable, { id: 'reg-withdrawn', decision: 'Withdrawn' });

    const { taggedFacilitatorIds } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(taggedFacilitatorIds).toEqual(['free']);
  });

  test('tags all free facilitators, topped up to 5 with ones who have no clash', async () => {
    await seedCoverRequest();
    for (const id of ['free-1', 'free-2', 'free-3']) {
      // eslint-disable-next-line no-await-in-loop
      await seedFacilitator(id);
    }

    for (const id of ['other-1', 'other-2', 'other-3', 'other-4']) {
      // eslint-disable-next-line no-await-in-loop
      await seedFacilitator(id, { availability: UNAVAILABLE });
    }

    const { messageDetails, taggedFacilitatorIds } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(namesOf(messageDetails.freeFacilitators)).toEqual(['free-1', 'free-2', 'free-3']);
    expect(messageDetails.noClashFacilitators).toHaveLength(2);
    expect(taggedFacilitatorIds).toHaveLength(5);
  });

  test('tags 5 free facilitators at random when more are free', async () => {
    await seedCoverRequest();
    for (let i = 1; i <= 7; i++) {
      // eslint-disable-next-line no-await-in-loop
      await seedFacilitator(`free-${i}`);
    }

    await seedFacilitator('other', { availability: UNAVAILABLE });

    const { messageDetails } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(messageDetails.freeFacilitators).toHaveLength(5);
    expect(messageDetails.noClashFacilitators).toEqual([]);
    expect(messageDetails.moreFreeThanTagged).toBe(true);
  });

  test('tags nobody when nobody else in the round is free', async () => {
    await seedCoverRequest();
    await seedFacilitator('clash');
    await seedDiscussionFacilitatedBy('clash', { startOffsetSeconds: 0 });

    const { messageDetails, taggedFacilitatorIds } = await caller.facilitators.getCoverRequestPreview(coverInput);

    expect(messageDetails.freeFacilitators).toEqual([]);
    expect(messageDetails.noClashFacilitators).toEqual([]);
    expect(taggedFacilitatorIds).toEqual([]);
  });

  test('rejects a discussion the caller does not facilitate, from another group, already started, or without an end', async () => {
    await seedCoverRequest();
    await seedSecondGroup();

    await expect(caller.facilitators.getCoverRequestPreview({ ...coverInput, groupId: GROUP_2_ID })).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await testDb.update(groupDiscussionTable, { id: DISCUSSION_ID, endDateTime: null });
    await expect(caller.facilitators.getCoverRequestPreview(coverInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await testDb.update(groupDiscussionTable, { id: DISCUSSION_ID, startDateTime: 1000, endDateTime: 2000 });
    await expect(caller.facilitators.getCoverRequestPreview(coverInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await testDb.update(meetPersonTable, { id: FACILITATOR_ID, expectedDiscussionsFacilitator: [] });
    await expect(caller.facilitators.getCoverRequestPreview(coverInput)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caller.facilitators.requestCover({ ...coverInput, taggedFacilitatorIds: [] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('rejects more than 5 tagged facilitators', async () => {
    await seedCoverRequest();

    await expect(caller.facilitators.requestCover({ ...coverInput, taggedFacilitatorIds: ['a', 'b', 'c', 'd', 'e', 'f'] }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  describe('requestCover', () => {
    const originalFetch = globalThis.fetch;
    const urlOf = (input: string | URL | Request) => (input instanceof Request ? input.url : input.toString());

    beforeEach(() => {
      env.COMMUNITY_SLACK_SUPPORT_BOT_TOKEN = 'xoxb-community';
      env.FACILITATOR_COMMUNITY_SLACK_CHANNEL_ID = 'CFACCOMMUNITY';
    });

    afterEach(() => {
      delete env.COMMUNITY_SLACK_SUPPORT_BOT_TOKEN;
      delete env.FACILITATOR_COMMUNITY_SLACK_CHANNEL_ID;
      vi.restoreAllMocks();
    });

    const stubSlack = ({ permalinkOk = true } = {}) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(urlOf(input));
      if (url.hostname !== 'slack.com') return originalFetch(input, init);
      if (url.pathname === '/api/chat.postMessage') return Response.json({ ok: true, ts: '1792500000.000100' });
      if (url.pathname === '/api/chat.getPermalink' && !permalinkOk) return Response.json({ ok: false, error: 'internal_error' });
      if (url.pathname === '/api/chat.getPermalink') return Response.json({ ok: true, permalink: 'https://community.slack.com/archives/CFACCOMMUNITY/p1792500000000100' });
      throw new Error(`Unexpected Slack call: ${url.pathname}`);
    });

    test('posts the previewed facilitators who are still eligible, and returns the permalink', async () => {
      await seedCoverRequest();
      await seedFacilitator('free');
      await seedFacilitator('unavailable', { availability: UNAVAILABLE });
      await seedFacilitator('clash');
      await seedDiscussionFacilitatedBy('clash', { startOffsetSeconds: 0 });
      const fetchSpy = stubSlack();

      const result = await caller.facilitators.requestCover({
        ...coverInput,
        note: 'Back from holiday late',
        taggedFacilitatorIds: ['unavailable', 'free', 'clash'],
      });

      expect(result).toEqual({ threadUrl: 'https://community.slack.com/archives/CFACCOMMUNITY/p1792500000000100' });
      const slackCalls = fetchSpy.mock.calls.filter(([input]) => urlOf(input).startsWith('https://slack.com/'));
      expect(slackCalls).toHaveLength(2);

      const [postUrl, postInit] = slackCalls[0]!;
      expect(postUrl).toBe('https://slack.com/api/chat.postMessage');
      expect(postInit?.headers).toMatchObject({ Authorization: 'Bearer xoxb-community' });
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
      expect(JSON.parse(postInit!.body as string)).toEqual({
        channel: 'CFACCOMMUNITY',
        unfurl_links: false,
        unfurl_media: false,
        text: [
          '<@UREQUESTER> is looking for cover for "Test · Unit 4 · Group 1 - Sam Rivera" on '
          + `*<!date^${startTimeSeconds}^{date_short_pretty} {time}|Fri 23 Oct, 07:00>–<!date^${endTimeSeconds}^{time}|09:00 UTC>* (07:00–09:00 UTC).`
          + ' Note from them: "Back from holiday late"',
          'Facilitators free at that time according to their availability: <@UFREE>. Others with no clashing session: <@UUNAVAILABLE>.',
          'If you can cover, please reply in this thread. You can reply even if you are not tagged above, as long as you\'ve facilitated this course recently! '
          + `<@UREQUESTER> can then go <${siteUrl}/facilitated-courses?changeFacilitator=discussion-1|here> to assign you as a substitute.`,
        ].join('\n\n'),
      });

      expect(slackCalls[1]![0]).toBe('https://slack.com/api/chat.getPermalink?channel=CFACCOMMUNITY&message_ts=1792500000.000100');
    });

    test('still succeeds, without a link, when the post goes through but the permalink fails', async () => {
      await seedCoverRequest();
      const fetchSpy = stubSlack({ permalinkOk: false });

      const result = await caller.facilitators.requestCover({ ...coverInput, taggedFacilitatorIds: [] });

      expect(result).toEqual({ threadUrl: null });
      expect(fetchSpy.mock.calls.filter(([input]) => urlOf(input).startsWith('https://slack.com/api/chat.postMessage'))).toHaveLength(1);
    });

    test('says so, without posting, when Slack is not set up', async () => {
      delete env.COMMUNITY_SLACK_SUPPORT_BOT_TOKEN;
      await seedCoverRequest();
      const fetchSpy = stubSlack();

      await expect(caller.facilitators.requestCover({ ...coverInput, taggedFacilitatorIds: [] }))
        .rejects.toMatchObject({ code: 'PRECONDITION_FAILED', message: 'Posting to #facilitator-community is not set up' });
      expect(fetchSpy.mock.calls.filter(([input]) => urlOf(input).startsWith('https://slack.com/'))).toEqual([]);
    });
  });
});
