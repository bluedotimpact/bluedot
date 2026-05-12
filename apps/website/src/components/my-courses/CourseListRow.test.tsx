import {
  describe, test, expect, vi,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CourseRegistration } from '@bluedot/db';
import {
  createMockCourseRegistration, createMockGroup,
} from '../../__tests__/testUtils';
import CourseListRow, { getSubtitle, type CourseListRowProps } from './CourseListRow';

describe('getSubtitle precedence', () => {
  type SubtitleArgs = Parameters<typeof getSubtitle>[0];

  const renderText = (node: React.ReactNode): string => {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    const { container } = render(<>{node}</>);
    return container.textContent ?? '';
  };

  const ROUND_START = '2026-03-10';
  const ROUND_END = '2026-03-17';

  const subtitleArgs = (overrides: Partial<SubtitleArgs> = {}): SubtitleArgs => ({
    courseRegistration: createMockCourseRegistration(),
    group: createMockGroup({ startTimeUtc: new Date('2026-05-13T16:00:00Z').getTime() / 1000 }),
    facilitatorNames: ['Shivam Arora'],
    numUnits: null,
    uniqueDiscussionAttendance: null,
    isNotInGroup: false,
    roundStartDate: null,
    roundEndDate: null,
    ...overrides,
  });

  test('Future + Accept → status word + Course starts', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: ROUND_START,
    })))).toBe('Application accepted! · Course starts 10 Mar');
  });

  test('Future + null decision → "Application in review"', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: null }),
      roundStartDate: ROUND_START,
    })))).toBe('Application in review · Course starts 10 Mar');
  });

  test('Future + Reject → "Application rejected" (no "Course starts" addendum)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' }),
      roundStartDate: ROUND_START,
    })))).toBe('Application rejected');
  });

  test('Future + no roundStartDate → status word only', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: null,
    })))).toBe('Application accepted!');
  });

  test('Past + cert (same month) → "Mar 10 – 17, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert (cross-month) → "Mar 10 – Apr 17, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-20T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2026-03-10',
      roundEndDate: '2026-04-17',
    })))).toBe('Mar 10 – Apr 17, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert (cross-year) → "Dec 28, 2025 – Jan 5, 2026 · Facilitated by …"', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-01-10T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2025-12-28',
      roundEndDate: '2026-01-05',
    })))).toBe('Dec 28, 2025 – Jan 5, 2026 · Facilitated by Shivam Arora');
  });

  test('Past + cert without facilitators → date range only', () => {
    expect(renderText(getSubtitle(subtitleArgs({
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
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: null,
      roundEndDate: null,
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Past + no cert + round dates → date range · attendance', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    })))).toBe('Mar 10 – 17, 2026 · You attended 6 out of 8 discussions');
  });

  test('Past + no cert + no round dates → attendance only', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    })))).toBe('You attended 6 out of 8 discussions');
  });

  test('Past + no cert + missing meetPerson data → empty (attendance suppressed when numUnits unknown)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: null,
      uniqueDiscussionAttendance: null,
    })))).toBe('');
  });

  test('Past + no cert + numUnits=0 (FOAI self-paced) → empty (attendance suppressed)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 0,
      uniqueDiscussionAttendance: 0,
    })))).toBe('');
  });

  test('Dropped + round dates → date range only', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: null,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026');
  });

  test('Dropped without round dates → no subtitle', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: null,
      }),
    })))).toBe('');
  });

  test('Deferred (dropoutId set with deferredId) is NOT treated as dropped', () => {
    // Deferred users have both dropoutId and deferredId; they're a separate state from dropped
    // and should fall through to the default branch. (Their next-round registration is the
    // active one in /my-courses.)
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Active', dropoutId: ['drop_1'], deferredId: ['def_1'],
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('isNotInGroup, no roundStartDate → "We\'re assigning you to a group" (no addendum)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
    })))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days');
  });

  test('isNotInGroup with roundStartDate → adds " · Course starts {date}" (desktop-visible span)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    })))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days · Course starts 10 Mar');
  });

  test('Active with group → recurring schedule', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
    })))).toBe('Wednesdays, 4:00 PM · Facilitated by Shivam Arora');
  });

  test('Active without group/facilitators → empty', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      facilitatorNames: [],
    })))).toBe('');
  });

  test('Future precedence: even with no group, the application status wins', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    })))).toBe('Application accepted! · Course starts 10 Mar');
  });

  test('Future + Accept + dropoutId + round dates → dropped wins (date range, not "Application accepted!")', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Future', decision: 'Accept', dropoutId: ['drop_1'], deferredId: null,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026');
  });

  test('Future + Accept + dropoutId without roundEndDate → no subtitle', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Future', decision: 'Accept', dropoutId: ['drop_1'], deferredId: null,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: null,
    })))).toBe('');
  });

  test('Future + Reject + dropoutId + round dates → dropped wins (date range)', () => {
    expect(renderText(getSubtitle(subtitleArgs({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Future', decision: 'Reject', dropoutId: ['drop_1'], deferredId: null,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    })))).toBe('Mar 10 – 17, 2026');
  });
});

describe('CourseListRow actions', () => {
  const renderRow = (props: CourseListRowProps) => render(<CourseListRow {...props} />);

  const baseProps = (overrides: Partial<CourseListRowProps> = {}): CourseListRowProps => ({
    course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
    courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
    group: createMockGroup({
      startTimeUtc: Math.floor(new Date('2026-05-13T16:00:00Z').getTime() / 1000),
      slackChannelId: 'C01ABCDEF',
      discussionDoc: 'https://example.com/doc',
    }),
    facilitatorNames: ['Shivam Arora'],
    meetPersonId: 'mp-default',
    groupsAsParticipant: ['group-default'],
    roundId: 'round-default',
    discussions: [],
    attendedDiscussionIds: [],
    units: {},
    roundStartDate: null,
    roundEndDate: null,
    numUnits: null,
    uniqueDiscussionAttendance: null,
    hasSubmittedActionPlan: false,
    feedbackFormUrl: null,
    hasSubmittedFeedback: false,
    rescheduleEligibleUnits: [],
    isExpanded: false,
    onToggleExpand: () => {},
    ...overrides,
  });

  /** Open the overflow menu and return its menu item labels. Returns [] when no menu renders. */
  const openOverflowItems = (container: HTMLElement): string[] => {
    const button = container.querySelector('button[aria-label="Course actions"]');
    if (!button) return [];
    fireEvent.click(button);
    return Array.from(document.querySelectorAll('[role="menuitem"]'))
      .map((i) => i.textContent?.trim() ?? '');
  };

  const inlineLabels = (container: HTMLElement): string[] => {
    const desktopInline = container.querySelector('.sm\\:flex');
    if (!desktopInline) return [];
    return Array.from(desktopInline.querySelectorAll('a, button'))
      .filter((el) => el.getAttribute('aria-label') !== 'Course actions')
      .map((el) => el.textContent?.trim() ?? '')
      .filter(Boolean);
  };

  describe('Open discussion doc / Open Slack group visibility', () => {
    test('shown on in-progress when group has discussionDoc + slackChannelId', () => {
      const { container } = renderRow(baseProps());
      const items = openOverflowItems(container);
      expect(items).toContain('Open discussion doc');
      expect(items).toContain('Open Slack group');
    });

    test('hidden when the group lacks the corresponding field', () => {
      const noDocNoSlack = createMockGroup({
        startTimeUtc: 0, slackChannelId: null, discussionDoc: null,
      });
      const { container } = renderRow(baseProps({ group: noDocNoSlack }));
      const items = openOverflowItems(container);
      expect(items).not.toContain('Open discussion doc');
      expect(items).not.toContain('Open Slack group');
    });
  });

  describe('Switch group permanently (regression: requires group + reschedule-eligible units)', () => {
    test('shown when group exists and at least one unit is reschedule-eligible', () => {
      const { container } = renderRow(baseProps({ rescheduleEligibleUnits: ['1', '2'] }));
      expect(openOverflowItems(container)).toContain('Switch group permanently');
    });

    test('hidden when no group (cannot meaningfully switch out of nothing)', () => {
      const { container } = renderRow(baseProps({ group: null, rescheduleEligibleUnits: ['1'] }));
      expect(openOverflowItems(container)).not.toContain('Switch group permanently');
    });

    test('hidden when there are no reschedule-eligible units (nowhere to switch to)', () => {
      const { container } = renderRow(baseProps({ rescheduleEligibleUnits: [] }));
      expect(openOverflowItems(container)).not.toContain('Switch group permanently');
    });

    test('hidden on completed even when group exists', () => {
      const completedReg = createMockCourseRegistration({ roundStatus: 'Past' });
      const { container } = renderRow(baseProps({ courseRegistration: completedReg, rescheduleEligibleUnits: ['1'] }));
      expect(openOverflowItems(container)).not.toContain('Switch group permanently');
    });
  });

  describe('Drop or defer course (regression: hidden on application states)', () => {
    test('shown on in-progress', () => {
      const { container } = renderRow(baseProps());
      expect(openOverflowItems(container)).toContain('Drop or defer course');
    });

    test('shown on upcoming + Accept', () => {
      const upcomingAccept = createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' });
      const { container } = renderRow(baseProps({ courseRegistration: upcomingAccept }));
      expect(openOverflowItems(container)).toContain('Drop or defer course');
    });

    test('hidden on upcoming + Reject (legacy match: rejected applicants do not see drop)', () => {
      const upcomingReject = createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' });
      const { container } = renderRow(baseProps({ courseRegistration: upcomingReject }));
      expect(openOverflowItems(container)).not.toContain('Drop or defer course');
    });

    test('hidden on upcoming + null decision (legacy match: in-review applicants do not see drop)', () => {
      const upcomingPending = createMockCourseRegistration({ roundStatus: 'Future', decision: null });
      const { container } = renderRow(baseProps({ courseRegistration: upcomingPending }));
      expect(openOverflowItems(container)).not.toContain('Drop or defer course');
    });

    test('hidden on completed', () => {
      const completed = createMockCourseRegistration({ roundStatus: 'Past' });
      const { container } = renderRow(baseProps({ courseRegistration: completed }));
      expect(openOverflowItems(container)).not.toContain('Drop or defer course');
    });
  });

  describe('no duplicate items across inline + overflow (regression)', () => {
    // Every action declares either `variant: 'inline'` or `variant: 'overflow'`, never both.
    // If a future change accidentally pushes the same action through both surfaces, this catches it.
    const cases: { name: string; props: () => CourseListRowProps }[] = [
      { name: 'in-progress', props: () => baseProps() },
      {
        name: 'upcoming-accept',
        props: () => baseProps({ courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }) }),
      },
      {
        name: 'upcoming-reject',
        props: () => baseProps({ courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' }) }),
      },
      {
        name: 'completed-no-cert',
        props: () => baseProps({ courseRegistration: createMockCourseRegistration({ roundStatus: 'Past' }) }),
      },
      {
        name: 'dropped',
        props: () => baseProps({
          courseRegistration: createMockCourseRegistration({
            roundStatus: 'Active',
            dropoutId: ['dropout-1'] as unknown as CourseRegistration['dropoutId'],
            deferredId: null,
          }),
        }),
      },
    ];

    test.each(cases)('$name has no label in both inline and overflow', ({ props }) => {
      const { container } = renderRow(props());
      const inline = inlineLabels(container);
      const overflow = openOverflowItems(container);
      const overlap = inline.filter((l) => overflow.includes(l));
      expect(overlap).toEqual([]);
    });
  });
});
