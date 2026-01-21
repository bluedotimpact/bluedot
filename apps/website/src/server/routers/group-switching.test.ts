import { type Group } from '@bluedot/db';
import { describe, expect, it } from 'vitest';
import { createMockGroup, createMockGroupDiscussion } from '../../__tests__/testUtils';
import { calculateGroupAvailability } from './group-switching';

describe('calculateGroupAvailability', () => {
  const now = Math.floor(Date.now() / 1000);
  const futureTimeSeconds = now + 24 * 60 * 60; // 24 hours from now, in seconds
  const pastTimeSeconds = now - 24 * 60 * 60; // 24 hours ago, in seconds

  const mockParticipantId = 'participant-123';

  it('should calculate spots left correctly with maxParticipants', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion({ participantsExpected: ['other-participant'] })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable).toHaveLength(1);
    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBe(4); // 5 max - 1 existing participant
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]).toHaveLength(1);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeftIfKnown).toBe(4);
  });

  it('should handle null maxParticipants', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion()];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: null,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBeNull();
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeftIfKnown).toBeNull();
  });

  it('should identify when user is a participant', () => {
    const groups = [createMockGroup({ participants: [mockParticipantId, 'other-participant'] })];
    const discussions = [createMockGroupDiscussion({ participantsExpected: [mockParticipantId, 'other-participant'] })];

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
    const discussions = [createMockGroupDiscussion()];

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
    const discussions = [createMockGroupDiscussion({ startDateTime: pastTimeSeconds })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.isTooLateToSwitchTo).toBe(true);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]).toHaveLength(0);
  });

  it('should detect when discussions have not started', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion({ startDateTime: futureTimeSeconds })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.isTooLateToSwitchTo).toBe(false);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]).toHaveLength(1);
  });

  it('should handle multiple discussions per group correctly', () => {
    const groups = [createMockGroup()];
    const discussions = [
      createMockGroupDiscussion({
        id: 'discussion-1',
        startDateTime: futureTimeSeconds,
        participantsExpected: ['participant-1', 'participant-2'],
      }),
      createMockGroupDiscussion({
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

    // Group should show isTooLateToSwitchTo as false (mixed)
    expect(result.groupsAvailable[0]?.isTooLateToSwitchTo).toBe(false);
    // Group spotsLeftIfKnown should be the minimum of available spots from non-started discussions
    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBe(3); // 5 max - 2 participants from future discussion
  });

  it('should handle groups with all discussions started', () => {
    const groups = [createMockGroup()];
    const discussions = [
      createMockGroupDiscussion({
        id: 'discussion-1',
        startDateTime: pastTimeSeconds,
      }),
      createMockGroupDiscussion({
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

    expect(result.groupsAvailable[0]?.isTooLateToSwitchTo).toBe(true);
    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBeNull(); // No spots available when all started
  });

  it('should skip discussions without unit numbers', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion({ unitNumber: null })];

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
    const discussions = [createMockGroupDiscussion()];

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
      createMockGroupDiscussion({
        id: 'discussion-1',
        group: 'group-1',
        unitNumber: 1,
      }),
      createMockGroupDiscussion({
        id: 'discussion-2',
        group: 'group-2',
        unitNumber: 1,
      }),
      createMockGroupDiscussion({
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
    const discussions = [createMockGroupDiscussion()];

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
      createMockGroupDiscussion({
        id: 'discussion-1',
        unitNumber: 1,
        participantsExpected: ['p1', 'p2'], // 2 participants
        startDateTime: futureTimeSeconds,
      }),
      createMockGroupDiscussion({
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
    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBe(2);
  });

  it('should enforce minimum spots left of 0', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion({
      participantsExpected: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], // 6 participants, exceeds max
    })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBe(0);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeftIfKnown).toBe(0);
  });

  it('should exclude participant from count when calculating spots', () => {
    const groups = [createMockGroup()];
    const discussions = [createMockGroupDiscussion({
      participantsExpected: [mockParticipantId, 'p1', 'p2'], // 3 total, but participant should be excluded
    })];

    const result = calculateGroupAvailability({
      groupDiscussions: discussions,
      groups,
      maxParticipants: 5,
      participantId: mockParticipantId,
    });

    // Should calculate based on 2 other participants: 5 - 2 = 3
    expect(result.groupsAvailable[0]?.spotsLeftIfKnown).toBe(3);
    expect(result.discussionsAvailable[String(discussions[0]!.unitNumber)]?.[0]?.spotsLeftIfKnown).toBe(3);
  });
});
