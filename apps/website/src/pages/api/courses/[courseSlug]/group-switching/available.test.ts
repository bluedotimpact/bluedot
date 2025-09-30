import { groupDiscussionTable, groupTable, InferSelectModel } from '@bluedot/db';
import { describe, expect, it } from 'vitest';
import { calculateGroupAvailability } from './available';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg>;

describe('calculateGroupAvailability', () => {
  const now = Math.floor(Date.now() / 1000);
  const futureTimeSeconds = now + 24 * 60 * 60; // 24 hours from now, in seconds
  const pastTimeSeconds = now - 24 * 60 * 60; // 24 hours ago, in seconds

  const mockParticipantId = 'participant-123';

  const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
    id: 'group-1',
    groupName: 'Test Group',
    groupDiscussions: ['discussion-1'],
    round: 'round-1',
    participants: ['other-participant'],
    whoCanSwitchIntoThisGroup: [],
    autoNumberId: 1,
    startTimeUtc: futureTimeSeconds,
    ...overrides,
  } as Group);

  const createMockDiscussion = (overrides: Partial<GroupDiscussion> = {}): GroupDiscussion => ({
    id: 'discussion-1',
    facilitators: ['facilitator-1'],
    participantsExpected: ['other-participant'],
    attendees: [],
    startDateTime: futureTimeSeconds,
    endDateTime: futureTimeSeconds + 2 * 60 * 60,
    group: 'group-1',
    zoomAccount: null,
    courseSite: null,
    unitNumber: 1,
    unit: 'unit-1',
    round: null,
    autoNumberId: null,
    zoomLink: null,
    activityDoc: null,
    courseBuilderUnitRecordId: null,
    ...overrides,
  } as GroupDiscussion);

  it('should calculate spots left correctly with maxParticipants', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable).toHaveLength(1);
    expect(result.groupsAvailable[0]?.spotsLeft).toBe(4); // 5 max - 1 existing participant
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]).toHaveLength(1);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeft).toBe(4);
  });

  it('should handle null maxParticipants', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: null,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.spotsLeft).toBeNull();
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeft).toBeNull();
  });

  it('should identify when user is a participant', () => {
    const groups = [createMockGroup({ participants: [mockParticipantId, 'other-participant'] })];
    const discussions = [createMockDiscussion({ participantsExpected: [mockParticipantId, 'other-participant'] })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.userIsParticipant).toBe(true);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.userIsParticipant).toBe(true);
  });

  it('should identify when user is not a participant', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.userIsParticipant).toBe(false);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.userIsParticipant).toBe(false);
  });

  it('should detect when discussions have started', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion({ startDateTime: pastTimeSeconds })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.allDiscussionsHaveStarted).toBe(true);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.hasStarted).toBe(true);
  });

  it('should detect when discussions have not started', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion({ startDateTime: futureTimeSeconds })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.allDiscussionsHaveStarted).toBe(false);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.hasStarted).toBe(false);
  });

  it('should handle multiple discussions per group correctly', () => {
    const groups = [createMockGroup()];
    const discussions = [
      createMockDiscussion({
        id: 'discussion-1',
        startDateTime: futureTimeSeconds,
        participantsExpected: ['participant-1', 'participant-2'],
      }),
      createMockDiscussion({
        id: 'discussion-2',
        startDateTime: pastTimeSeconds,
        participantsExpected: ['participant-3'],
      }),
    ];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    // Group should show allDiscussionsHaveStarted as false (mixed)
    expect(result.groupsAvailable[0]?.allDiscussionsHaveStarted).toBe(false);
    // Group spotsLeft should be the minimum of available spots from non-started discussions
    expect(result.groupsAvailable[0]?.spotsLeft).toBe(3); // 5 max - 2 participants from future discussion
  });

  it('should handle groups with all discussions started', () => {
    const groups = [createMockGroup()];
    const discussions = [
      createMockDiscussion({
        id: 'discussion-1',
        startDateTime: pastTimeSeconds,
      }),
      createMockDiscussion({
        id: 'discussion-2',
        startDateTime: pastTimeSeconds - 1000,
      }),
    ];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.allDiscussionsHaveStarted).toBe(true);
    expect(result.groupsAvailable[0]?.spotsLeft).toBeNull(); // No spots available when all started
  });

  it('should skip discussions without unit numbers', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion({ unitNumber: null })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable).toHaveLength(0);
    expect(Object.keys(result.discussionsAvailable)).toHaveLength(0);
  });

  it('should skip discussions without corresponding groups', () => {
    const groups: Group[] = [];
    const discussions = [createMockDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable).toHaveLength(0);
    expect(Object.keys(result.discussionsAvailable)).toHaveLength(0);
  });

  it('should group discussions by unit number', () => {
    const groups = [
      createMockGroup({ id: 'group-1' }),
      createMockGroup({ id: 'group-2' }),
    ];
    const discussions = [
      createMockDiscussion({
        id: 'discussion-1',
        group: 'group-1',
        unitNumber: 1,
      }),
      createMockDiscussion({
        id: 'discussion-2',
        group: 'group-2',
        unitNumber: 1,
      }),
      createMockDiscussion({
        id: 'discussion-3',
        group: 'group-1',
        unitNumber: 2,
      }),
    ];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]).toHaveLength(2);
    expect(result.discussionsAvailable[String(discussions[2]!.unitNumber)]).toHaveLength(1);
    expect(result.groupsAvailable).toHaveLength(2);
  });

  it('should handle groups with no name gracefully', () => {
    const groups = [createMockGroup({ groupName: null })];
    const discussions = [createMockDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.groupName).toBe('Group [Unknown]');
  });

  it('should calculate minimum spots left across multiple discussions for a group', () => {
    const groups = [createMockGroup()];
    const discussions = [
      createMockDiscussion({
        id: 'discussion-1',
        unitNumber: 1,
        participantsExpected: ['p1', 'p2'], // 2 participants
        startDateTime: futureTimeSeconds,
      }),
      createMockDiscussion({
        id: 'discussion-2',
        unitNumber: 2,
        participantsExpected: ['p1', 'p2', 'p3'], // 3 participants
        startDateTime: futureTimeSeconds,
      }),
    ];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    // Should take minimum: min(5-2, 5-3) = min(3, 2) = 2
    expect(result.groupsAvailable[0]?.spotsLeft).toBe(2);
  });

  it('should enforce minimum spots left of 0', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion({
      participantsExpected: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], // 6 participants, exceeds max
    })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.spotsLeft).toBe(0);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeft).toBe(0);
  });

  it('should exclude participant from count when calculating spots', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockDiscussion({
      participantsExpected: [mockParticipantId, 'p1', 'p2'], // 3 total, but participant should be excluded
    })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    // Should calculate based on 2 other participants: 5 - 2 = 3
    expect(result.groupsAvailable[0]?.spotsLeft).toBe(3);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeft).toBe(3);
  });
});
