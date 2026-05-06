import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import {
  createMockCourseRegistration, createMockGroup, createMockGroupDiscussion,
} from '../../__tests__/testUtils';
import { getSubtitle } from './CourseListRow';

type Args = Parameters<typeof getSubtitle>[0];

const renderText = (node: React.ReactNode): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  const { container } = render(<>{node}</>);
  return container.textContent ?? '';
};

const ROUND_START = '2026-03-10';
const ROUND_END = '2026-03-17';

const buildArgs = (overrides: Partial<Args> = {}): Args => ({
  courseRegistration: createMockCourseRegistration(),
  group: createMockGroup({ startTimeUtc: new Date('2026-05-13T16:00:00Z').getTime() / 1000 }),
  facilitatorNames: ['Shivam Arora'],
  discussions: [],
  numUnits: null,
  uniqueDiscussionAttendance: null,
  isNotInGroup: false,
  roundStartDate: null,
  roundEndDate: null,
  ...overrides,
});

describe('getSubtitle precedence', () => {
  test('Future + Accept → status word + Course starts', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: ROUND_START,
    })))).toBe('Application accepted! · Course starts 10 Mar');
  });

  test('Future + null decision → "Application in review"', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: null }),
      roundStartDate: ROUND_START,
    })))).toBe('Application in review · Course starts 10 Mar');
  });

  test('Future + Reject → "Application rejected"', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' }),
      roundStartDate: ROUND_START,
    })))).toBe('Application rejected · Course starts 10 Mar');
  });

  test('Future + no roundStartDate → status word only', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: null,
    })))).toBe('Application accepted!');
  });

  test('Past + cert (same month) → "Mar 10 – 17, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert (cross-month) → "Mar 10 – Apr 17, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-20T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2026-03-10',
      roundEndDate: '2026-04-17',
    })))).toBe('Mar 10 – Apr 17, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert (cross-year) → "Dec 28, 2025 – Jan 5, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-01-10T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2025-12-28',
      roundEndDate: '2026-01-05',
    })))).toBe('Dec 28, 2025 – Jan 5, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert without facilitators → date range only', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
      facilitatorNames: [],
    })))).toBe('Mar 10 – 17, 2026');
  });

  test('Past + cert without round dates → falls through (recurring schedule)', () => {
    // Defensive: if a cert exists but the round dates aren't loaded, skip the date-range
    // branch and fall to the recurring-schedule line rather than rendering nothing.
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: null,
      roundEndDate: null,
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Past + no cert + round dates → date range · attendance', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    })))).toBe('Mar 10 – 17, 2026 · You attended 6 out of 8 discussions');
  });

  test('Past + no cert + no round dates → attendance only', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    })))).toBe('You attended 6 out of 8 discussions');
  });

  test('Past + no cert + missing meetPerson data → empty (attendance suppressed when numUnits unknown)', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: null,
      uniqueDiscussionAttendance: null,
    })))).toBe('');
  });

  test('Past + no cert + numUnits=0 (FOAI self-paced) → empty (attendance suppressed)', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 0,
      uniqueDiscussionAttendance: 0,
    })))).toBe('');
  });

  test('Dropped + round dates → date range only', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: null,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026');
  });

  test('Dropped without round dates → falls through to recurring schedule', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: null,
      }),
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Deferred (dropoutId set with deferredId) is NOT treated as dropped', () => {
    // Deferred users have both dropoutId and deferredId; they're a separate state from dropped
    // and should fall through to the default branch. (Their next-round registration is the
    // active one in /my-courses.)
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: ['def_1'],
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('isNotInGroup, no roundStartDate → "We\'re assigning you to a group" (no addendum)', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
    })))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days');
  });

  test('isNotInGroup with roundStartDate → adds " · Course starts {date}" (desktop-visible span)', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    })))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days · Course starts 10 Mar');
  });

  test('Active with discussions → recurring schedule', () => {
    const discussions = [createMockGroupDiscussion({ unitNumber: 1, id: 'disc-1' })];
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      discussions,
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Active without discussions but with group → recurring schedule', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      discussions: [],
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Active without group/facilitators/discussions → empty', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      facilitatorNames: [],
      discussions: [],
    })))).toBe('');
  });

  test('Future precedence: even with no group, the application status wins', () => {
    expect(renderText(getSubtitle(buildArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    })))).toBe('Application accepted! · Course starts 10 Mar');
  });
});
