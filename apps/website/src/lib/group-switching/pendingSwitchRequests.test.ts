import { describe, expect, test } from 'vitest';
import {
  getDiscussionPendingSwitch, getPendingSwitchRequestState, getRoundEndMs, type PendingSwitchRequestState, type SwitchRequestRow,
} from './pendingSwitchRequests';

const NOW_MS = new Date('2026-09-23T10:00:00Z').getTime();
const LIVE_ROUND_END_MS = getRoundEndMs('2026-10-24');
const ENDED_ROUND_END_MS = getRoundEndMs('2026-08-31');

const oneUnit = (overrides: Partial<SwitchRequestRow> = {}): SwitchRequestRow => ({
  requestStatus: 'Resolve',
  switchType: 'Switch group for one unit',
  oldDiscussion: ['disc-unit-3'],
  ...overrides,
});

const permanent = (overrides: Partial<SwitchRequestRow> = {}): SwitchRequestRow => ({
  requestStatus: 'Resolve',
  switchType: 'Switch group permanently',
  oldDiscussion: null,
  ...overrides,
});

const NOTHING_PENDING: PendingSwitchRequestState = { discussionIdsWithPendingReschedule: [], hasPendingGroupSwitchRequest: false };

describe('getPendingSwitchRequestState', () => {
  test.each<{
    rule: string;
    switchRequests: SwitchRequestRow[];
    attendedDiscussionIds?: string[];
    roundEndMs?: number | null;
    expected: PendingSwitchRequestState;
  }>([
    {
      rule: '1: open manual one-unit request on an upcoming discussion',
      switchRequests: [oneUnit()],
      expected: { discussionIdsWithPendingReschedule: ['disc-unit-3'], hasPendingGroupSwitchRequest: false },
    },
    {
      rule: '1: self-serve one-unit request before the automation completes it',
      switchRequests: [oneUnit({ requestStatus: 'Requested' })],
      expected: { discussionIdsWithPendingReschedule: ['disc-unit-3'], hasPendingGroupSwitchRequest: false },
    },
    {
      rule: '2: old discussion is past and not attended (still pending; the row shows Absent too)',
      switchRequests: [oneUnit({ oldDiscussion: ['disc-unit-2'] })],
      attendedDiscussionIds: ['disc-unit-1'],
      expected: { discussionIdsWithPendingReschedule: ['disc-unit-2'], hasPendingGroupSwitchRequest: false },
    },
    {
      rule: '3: attended the old discussion anyway',
      switchRequests: [oneUnit()],
      attendedDiscussionIds: ['disc-unit-3'],
      expected: NOTHING_PENDING,
    },
    {
      rule: '4: stale Aug "Requested" rows in a round that ended 2026-08-31',
      switchRequests: [
        oneUnit({ requestStatus: 'Requested' }),
        oneUnit({ requestStatus: 'Requested', oldDiscussion: ['disc-unit-4'] }),
        permanent({ requestStatus: 'Requested' }),
      ],
      roundEndMs: ENDED_ROUND_END_MS,
      expected: NOTHING_PENDING,
    },
    {
      rule: '5: request Completed',
      switchRequests: [oneUnit({ requestStatus: 'Completed' })],
      expected: NOTHING_PENDING,
    },
    {
      rule: '6: request Archived',
      switchRequests: [oneUnit({ requestStatus: 'Archived' })],
      expected: NOTHING_PENDING,
    },
    {
      rule: '7: duplicate open requests on the same discussion',
      switchRequests: [
        oneUnit({ oldDiscussion: ['disc-unit-3'] }),
        oneUnit({ oldDiscussion: ['disc-unit-3'], requestStatus: 'Requested' }),
        oneUnit({ oldDiscussion: ['disc-unit-4'] }),
        oneUnit({ oldDiscussion: ['disc-unit-4'] }),
      ],
      expected: { discussionIdsWithPendingReschedule: ['disc-unit-3', 'disc-unit-4'], hasPendingGroupSwitchRequest: false },
    },
    {
      rule: '8: reschedule eligibility is not an input, so an ineligible unit still shows pending',
      switchRequests: [oneUnit({ oldDiscussion: ['disc-full-unit'] })],
      expected: { discussionIdsWithPendingReschedule: ['disc-full-unit'], hasPendingGroupSwitchRequest: false },
    },
    {
      rule: '9: legacy "Join group for one unit" and empty oldDiscussion are ignored',
      switchRequests: [
        oneUnit({ switchType: 'Join group for one unit', oldDiscussion: null }),
        oneUnit({ switchType: 'Join group for one unit', oldDiscussion: ['disc-unit-3'] }),
        oneUnit({ oldDiscussion: [] }),
        oneUnit({ oldDiscussion: null }),
      ],
      expected: NOTHING_PENDING,
    },
    {
      rule: '10: open permanent request, round not ended',
      switchRequests: [permanent()],
      expected: { discussionIdsWithPendingReschedule: [], hasPendingGroupSwitchRequest: true },
    },
    {
      rule: '11: open permanent request and open one-unit request are independent',
      switchRequests: [permanent(), oneUnit()],
      expected: { discussionIdsWithPendingReschedule: ['disc-unit-3'], hasPendingGroupSwitchRequest: true },
    },
    {
      rule: '12: open status counts as open regardless of who created it (e.g. ops, on a group disband)',
      switchRequests: [permanent({ requestStatus: 'Requested' })],
      expected: { discussionIdsWithPendingReschedule: [], hasPendingGroupSwitchRequest: true },
    },
    {
      rule: '13: permanent request Completed',
      switchRequests: [permanent({ requestStatus: 'Completed' })],
      expected: NOTHING_PENDING,
    },
  ])('rule $rule', ({
    switchRequests, attendedDiscussionIds = [], roundEndMs = LIVE_ROUND_END_MS, expected,
  }) => {
    expect(getPendingSwitchRequestState({
      switchRequests, attendedDiscussionIds, roundEndMs, nowMs: NOW_MS,
    })).toEqual(expected);
  });

  test('an unknown round end does not hide open requests', () => {
    expect(getPendingSwitchRequestState({
      switchRequests: [oneUnit()], attendedDiscussionIds: [], roundEndMs: null, nowMs: NOW_MS,
    }).discussionIdsWithPendingReschedule).toEqual(['disc-unit-3']);
  });
});

describe('getDiscussionPendingSwitch', () => {
  test.each<{ rule: string; state: PendingSwitchRequestState; expected: ReturnType<typeof getDiscussionPendingSwitch> }>([
    { rule: 'nothing pending', state: NOTHING_PENDING, expected: null },
    {
      rule: 'one-unit request out of this discussion',
      state: { discussionIdsWithPendingReschedule: ['disc-unit-3'], hasPendingGroupSwitchRequest: false },
      expected: 'Switch group for one unit',
    },
    {
      rule: 'one-unit request out of a different discussion only',
      state: { discussionIdsWithPendingReschedule: ['disc-unit-4'], hasPendingGroupSwitchRequest: false },
      expected: null,
    },
    {
      rule: 'permanent request covers every discussion',
      state: { discussionIdsWithPendingReschedule: [], hasPendingGroupSwitchRequest: true },
      expected: 'Switch group permanently',
    },
    {
      rule: 'both open: the one-unit request out of this discussion wins',
      state: { discussionIdsWithPendingReschedule: ['disc-unit-3'], hasPendingGroupSwitchRequest: true },
      expected: 'Switch group for one unit',
    },
    {
      rule: 'both open, one-unit request is for another discussion',
      state: { discussionIdsWithPendingReschedule: ['disc-unit-4'], hasPendingGroupSwitchRequest: true },
      expected: 'Switch group permanently',
    },
  ])('$rule', ({ state, expected }) => {
    expect(getDiscussionPendingSwitch(state, 'disc-unit-3')).toBe(expected);
  });
});

describe('getRoundEndMs', () => {
  test('the round is over at the end of its last discussion day', () => {
    expect(getRoundEndMs('2026-08-31')).toBe(new Date('2026-09-01T00:00:00Z').getTime());
  });

  test('missing or unparseable dates are unknown', () => {
    expect(getRoundEndMs(null)).toBeNull();
    expect(getRoundEndMs('')).toBeNull();
    expect(getRoundEndMs('not a date')).toBeNull();
  });
});
