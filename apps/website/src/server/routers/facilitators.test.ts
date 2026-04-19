import {
  courseFeedbackTable,
  courseTable,
  groupTable,
  meetPersonTable,
  peerFeedbackTable,
  roundTable,
} from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const FACILITATOR_EMAIL = 'test@example.com';
const FACILITATOR_ID = 'facilitator-1';
const PARTICIPANT_1 = 'participant-1';
const PARTICIPANT_2 = 'participant-2';
const OUTSIDER = 'outsider-1';
const ROUND_ID = 'round-1';
const GROUP_ID = 'group-1';

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
    email: FACILITATOR_EMAIL,
    round: ROUND_ID,
    role: 'Facilitator',
  });
  await testDb.insert(meetPersonTable, {
    id: PARTICIPANT_1,
    email: 'p1@example.com',
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: PARTICIPANT_2,
    email: 'p2@example.com',
    round: ROUND_ID,
    role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: OUTSIDER,
    email: 'outsider@example.com',
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

const baseInput = {
  meetPersonId: FACILITATOR_ID,
  participantId: PARTICIPANT_1,
  initiativeRating: 4,
  reasoningQualityRating: 5,
  feedback: 'Great work',
  nextSteps: ['Recommend to facilitate'],
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
      nextSteps: ['Recommend to facilitate'],
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

  test('rejects participantId that is not in the facilitator\'s group', async () => {
    await seedFacilitatorGroup();

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      participantId: OUTSIDER,
    })).rejects.toThrow('Participant is not in your group');

    expect(await testDb.scan(peerFeedbackTable)).toHaveLength(0);
    // No course_feedback stub should be created either
    expect(await testDb.scan(courseFeedbackTable)).toHaveLength(0);
  });

  test('rejects meetPersonId that belongs to a Participant, not a Facilitator', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'participant-self',
      email: FACILITATOR_EMAIL,
      round: ROUND_ID,
      role: 'Participant',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      meetPersonId: 'participant-self',
    })).rejects.toThrow('Not authorized');
  });

  test('rejects meetPersonId that belongs to a different user', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'other-facilitator',
      email: 'other@example.com',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    await expect(caller.facilitators.savePeerFeedback({
      ...baseInput,
      meetPersonId: 'other-facilitator',
    })).rejects.toThrow('Not authorized');
  });

  test('rejects if facilitator has no group', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1', slug: 'test', title: 'Test', shortDescription: 'T', units: [],
    });
    await testDb.insert(roundTable, { id: ROUND_ID, title: 'R', course: 'course-1' });
    await testDb.insert(meetPersonTable, {
      id: FACILITATOR_ID,
      email: FACILITATOR_EMAIL,
      round: ROUND_ID,
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: PARTICIPANT_1, email: 'p1@example.com', round: ROUND_ID, role: 'Participant',
    });

    await expect(caller.facilitators.savePeerFeedback(baseInput))
      .rejects.toThrow('No group found for this facilitator');
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

    expect(result.groupId).toBe(GROUP_ID);
    expect(result.participants.map((p) => p.id).sort()).toEqual([PARTICIPANT_1, PARTICIPANT_2].sort());
    expect(result.existingCourseFeedback).toMatchObject({
      courseRating: 5,
      courseValue: 'Great course',
      improvements: 'None',
    });
    expect(result.existingCourseFeedback?.submittedAt).toBeTypeOf('number');
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
      email: 'other@example.com',
      round: ROUND_ID,
      role: 'Facilitator',
    });

    await expect(caller.facilitators.getFeedbackFormData({ meetPersonId: 'other-facilitator' }))
      .rejects.toThrow('Not authorized');
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

  test('creates course_feedback stub and sets submittedAt on first submit', async () => {
    await seedFacilitatorGroup();

    const before = Math.floor(Date.now() / 1000);
    const { courseFeedbackId } = await caller.facilitators.submitFeedback(submitInput);
    const after = Math.floor(Date.now() / 1000);

    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]!.id).toBe(courseFeedbackId);
    expect(cfs[0]).toMatchObject({
      courseRating: 4,
      courseValue: 'Valuable',
      improvements: 'More exercises',
    });
    expect(cfs[0]!.submittedAt).toBeGreaterThanOrEqual(before);
    expect(cfs[0]!.submittedAt).toBeLessThanOrEqual(after);
  });

  test('reuses existing course_feedback (e.g. stub from savePeerFeedback)', async () => {
    await seedFacilitatorGroup();
    await caller.facilitators.savePeerFeedback(baseInput);
    const [stub] = await testDb.scan(courseFeedbackTable);

    const { courseFeedbackId } = await caller.facilitators.submitFeedback(submitInput);

    expect(courseFeedbackId).toBe(stub!.id);
    const cfs = await testDb.scan(courseFeedbackTable);
    expect(cfs).toHaveLength(1);
    expect(cfs[0]!.submittedAt).toBeTypeOf('number');
  });

  test('rejects meetPersonId that belongs to a Participant', async () => {
    await seedFacilitatorGroup();
    await testDb.insert(meetPersonTable, {
      id: 'participant-self',
      email: FACILITATOR_EMAIL,
      round: ROUND_ID,
      role: 'Participant',
    });

    await expect(caller.facilitators.submitFeedback({
      ...submitInput,
      meetPersonId: 'participant-self',
    })).rejects.toThrow('Not authorized');
  });
});

