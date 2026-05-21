import { describe, test, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  createMockCourseRegistration, createMockGroup,
} from '../../__tests__/testUtils';
import CourseListRow, { getSubtitle, type FacilitatorRowProps, type ParticipantRowProps } from './CourseListRow';
import { classifyCourseRegistration } from './useCourseListRow';

describe('getSubtitle precedence', () => {
  const renderText = (node: React.ReactNode): string => {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    const { container } = render(<>{node}</>);
    return container.textContent ?? '';
  };

  const ROUND_START = '2026-03-10';
  const ROUND_END = '2026-03-17';

  type SubtitleArgs = Partial<ParticipantRowProps> & { isNotInGroup?: boolean };
  const callGetSubtitle = (overrides: SubtitleArgs = {}) => {
    const { isNotInGroup = false, ...rowOverrides } = overrides;
    const row: ParticipantRowProps = {
      mode: 'participant',
      courseRegistration: createMockCourseRegistration(),
      course: { slug: 'tais', title: 'TAIS', applyUrl: null },
      group: createMockGroup({ startTimeUtc: new Date('2026-05-13T16:00:00Z').getTime() / 1000 }),
      meetPersonId: null,
      groupsAsParticipant: null,
      roundId: null,
      discussions: [],
      attendedDiscussionIds: [],
      units: {},
      roundStartDate: null,
      roundEndDate: null,
      hasSubmittedFeedback: false,
      isDroppedOut: false,
      isDeferred: false,
      facilitatorNames: ['Test Facilitator'],
      rescheduleEligibleUnits: [],
      numUnits: null,
      uniqueDiscussionAttendance: null,
      hasSubmittedActionPlan: false,
      feedbackFormUrl: null,
      ...rowOverrides,
    };
    return getSubtitle(row, { isNotInGroup });
  };

  test('Future + Accept → status word + Course starts', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: ROUND_START,
    }))).toBe('Application accepted! · Course starts 10 Mar');
  });

  test('Future + null decision → "Application in review"', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: null }),
      roundStartDate: ROUND_START,
    }))).toBe('Application in review · Course starts 10 Mar');
  });

  test('Future + Reject → "Application rejected" (no "Course starts" addendum)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' }),
      roundStartDate: ROUND_START,
    }))).toBe('Application rejected');
  });

  test('Future + no roundStartDate → status word only', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      roundStartDate: null,
    }))).toBe('Application accepted!');
  });

  test('Past + cert (same month) → "Mar 10 – 17, 2026 · Facilitated by …"', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    }))).toBe('Mar 10 – 17, 2026 · Facilitated by Test Facilitator');
  });

  test('Past + cert (cross-month) → "Mar 10 – Apr 17, 2026 · Facilitated by …"', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-20T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2026-03-10',
      roundEndDate: '2026-04-17',
    }))).toBe('Mar 10 – Apr 17, 2026 · Facilitated by Test Facilitator');
  });

  test('Past + cert (cross-year) → "Dec 28, 2025 – Jan 5, 2026 · Facilitated by …"', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-01-10T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: '2025-12-28',
      roundEndDate: '2026-01-05',
    }))).toBe('Dec 28, 2025 – Jan 5, 2026 · Facilitated by Test Facilitator');
  });

  test('Past + cert without facilitators → date range only', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
      facilitatorNames: [],
    }))).toBe('Mar 10 – 17, 2026');
  });

  test('Past + cert without round dates → falls through (recurring schedule)', () => {
    // Defensive: if a cert exists but the round dates aren't loaded, skip the date-range
    // branch and fall to the recurring-schedule line rather than rendering nothing.
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({
        roundStatus: 'Past', certificateCreatedAt: new Date('2026-04-01T00:00:00Z').getTime() / 1000,
      }),
      roundStartDate: null,
      roundEndDate: null,
    }))).toBe('Wednesdays, 4:00 PM · Facilitated by Test Facilitator');
  });

  test('Past + no cert + round dates → date range · attendance', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    }))).toBe('Mar 10 – 17, 2026 · You attended 6 out of 8 discussions');
  });

  test('Past + no cert + no round dates → attendance only', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 8,
      uniqueDiscussionAttendance: 6,
    }))).toBe('You attended 6 out of 8 discussions');
  });

  test('Past + no cert + missing meetPerson data → empty (attendance suppressed when numUnits unknown)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: null,
      uniqueDiscussionAttendance: null,
    }))).toBe('');
  });

  test('Past + no cert + numUnits=0 (FOAI self-paced) → empty (attendance suppressed)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
      numUnits: 0,
      uniqueDiscussionAttendance: 0,
    }))).toBe('');
  });

  test('Dropped + round dates → date range only', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      isDroppedOut: true,
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    }))).toBe('Mar 10 – 17, 2026');
  });

  test('Dropped without round dates → no subtitle', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      isDroppedOut: true,
    }))).toBe('');
  });

  test('Deferred is NOT treated as dropped', () => {
    // Deferred users have a deferral entry in the dropout table; they're a separate state from
    // dropped and should fall through to the default branch. (Their next-round registration is
    // the active one in /my-courses.)
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      isDeferred: true,
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    }))).toBe('Wednesdays, 4:00 PM · Facilitated by Test Facilitator');
  });

  test('isNotInGroup, no roundStartDate → "We\'re assigning you to a group" (no addendum)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
    }))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days');
  });

  test('isNotInGroup with roundStartDate → adds " · Course starts {date}" (desktop-visible span)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    }))).toBe('We\'re assigning you to a group, you\'ll receive an email from us within the next few days · Course starts 10 Mar');
  });

  test('Active with group → recurring schedule', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
    }))).toBe('Wednesdays, 4:00 PM · Facilitated by Test Facilitator');
  });

  test('Active without group/facilitators → empty', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
      group: null,
      facilitatorNames: [],
    }))).toBe('');
  });

  test('Future precedence: even with no group, the application status wins', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      group: null,
      isNotInGroup: true,
      roundStartDate: ROUND_START,
    }))).toBe('Application accepted! · Course starts 10 Mar');
  });

  test('Future + Accept + dropped + round dates → dropped wins (date range, not "Application accepted!")', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      isDroppedOut: true,
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    }))).toBe('Mar 10 – 17, 2026');
  });

  test('Future + Accept + dropped without roundEndDate → no subtitle', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept' }),
      isDroppedOut: true,
      roundStartDate: ROUND_START,
      roundEndDate: null,
    }))).toBe('');
  });

  test('Future + Reject + dropped + round dates → dropped wins (date range)', () => {
    expect(renderText(callGetSubtitle({
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject' }),
      isDroppedOut: true,
      roundStartDate: ROUND_START,
      roundEndDate: ROUND_END,
    }))).toBe('Mar 10 – 17, 2026');
  });
});

describe('CourseListRow actions', () => {
  const renderRow = (props: ParticipantRowProps) => render(<CourseListRow {...props} />);

  const baseProps = (overrides: Partial<ParticipantRowProps> = {}): ParticipantRowProps => ({
    mode: 'participant',
    course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
    courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
    group: createMockGroup({
      startTimeUtc: Math.floor(new Date('2026-05-13T16:00:00Z').getTime() / 1000),
      slackChannelId: 'C01ABCDEF',
      discussionDoc: 'https://example.com/doc',
    }),
    facilitatorNames: ['Test Facilitator'],
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
    isDroppedOut: false,
    isDeferred: false,
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

  describe('Certificate visibility (regression: cert can exist before roundStatus flips to Past)', () => {
    test('classifies as completed when a cert exists even while roundStatus is Active', () => {
      const reg = createMockCourseRegistration({ roundStatus: 'Active', certificateCreatedAt: 1700000000 });
      expect(classifyCourseRegistration(reg)).toBe('completed');
    });

    test('shows the View certificate button for a cert on an Active round', () => {
      const reg = createMockCourseRegistration({ roundStatus: 'Active', certificateCreatedAt: 1700000000 });
      const { container } = renderRow(baseProps({ courseRegistration: reg }));
      expect(inlineLabels(container)).toContain('View certificate');
    });
  });

  describe('no duplicate items across inline + overflow (regression)', () => {
    // Every action declares either `variant: 'inline'` or `variant: 'overflow'`, never both.
    // If a future change accidentally pushes the same action through both surfaces, this catches it.
    const cases: { name: string; props: () => ParticipantRowProps }[] = [
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
          courseRegistration: createMockCourseRegistration({ roundStatus: 'Active' }),
          isDroppedOut: true,
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

  describe('facilitator mode', () => {
    const renderFacRow = (p: FacilitatorRowProps) => render(<CourseListRow {...p} />);

    const facProps = (overrides: Partial<FacilitatorRowProps> = {}): FacilitatorRowProps => ({
      mode: 'facilitator',
      course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
      courseRegistration: createMockCourseRegistration({ roundStatus: 'Active', role: 'Facilitator' }),
      group: createMockGroup({
        startTimeUtc: Math.floor(new Date('2026-05-13T16:00:00Z').getTime() / 1000),
        slackChannelId: 'C01ABCDEF',
        discussionDoc: 'https://example.com/doc',
      }),
      meetPersonId: 'mp-fac',
      roundId: 'round-fac',
      discussions: [],
      attendedDiscussionIds: [],
      units: {},
      roundStartDate: '2026-05-04',
      roundEndDate: '2026-05-11',
      roundIntensity: 'Intensive',
      hasSubmittedFeedback: false,
      isDroppedOut: false,
      isDeferred: false,
      isExpanded: false,
      onToggleExpand: () => {},
      ...overrides,
    });

    describe('Active (in-progress with group)', () => {
      test('overflow contains the four header items', () => {
        const { container } = renderFacRow(facProps());
        const items = openOverflowItems(container);
        expect(items).toEqual(expect.arrayContaining([
          'Open discussion doc', 'Open Slack group', 'View participants', 'Update discussion time',
        ]));
      });

      test('no participant-only overflow items', () => {
        const { container } = renderFacRow(facProps());
        const items = openOverflowItems(container);
        expect(items).not.toContain('Drop or defer course');
        expect(items).not.toContain('Switch group permanently');
      });

      test('no inline actions on the header itself', () => {
        const { container } = renderFacRow(facProps());
        const inline = inlineLabels(container);
        expect(inline).toEqual([]);
      });
    });

    describe('Update discussion time visibility', () => {
      test('shown when active + group present', () => {
        const { container } = renderFacRow(facProps());
        expect(openOverflowItems(container)).toContain('Update discussion time');
      });

      test('hidden on pending (no group)', () => {
        const { container } = renderFacRow(facProps({
          courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept', role: 'Facilitator' }),
          group: null,
        }));
        expect(openOverflowItems(container)).not.toContain('Update discussion time');
      });

      test('hidden on past', () => {
        const { container } = renderFacRow(facProps({
          courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', role: 'Facilitator' }),
        }));
        expect(openOverflowItems(container)).not.toContain('Update discussion time');
      });
    });

    describe('Pending application row (Future + no group)', () => {
      const pending = (overrides: Partial<FacilitatorRowProps> = {}) => facProps({
        courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Accept', role: 'Facilitator' }),
        group: null,
        ...overrides,
      });

      test('shows the "Application pending" pill', () => {
        const { container } = renderFacRow(pending());
        expect(container.textContent).toContain('Application pending');
      });

      test('shows "Share availability" CTA when none submitted', () => {
        const { container } = renderFacRow(pending());
        expect(inlineLabels(container)).toContain('Share availability');
      });

      test('flips to "Edit your availability" once submitted', () => {
        const { container } = renderFacRow(pending({
          courseRegistration: createMockCourseRegistration({
            roundStatus: 'Future', decision: 'Accept', role: 'Facilitator', availabilityIntervalsUTC: '[[100,200]]',
          }),
        }));
        expect(inlineLabels(container)).toContain('Edit your availability');
      });

      test('no overflow menu on pending rows', () => {
        const { container } = renderFacRow(pending());
        expect(openOverflowItems(container)).toEqual([]);
      });

      test('no availability CTA when application was rejected', () => {
        const { container } = renderFacRow(pending({
          courseRegistration: createMockCourseRegistration({ roundStatus: 'Future', decision: 'Reject', role: 'Facilitator' }),
        }));
        const labels = inlineLabels(container);
        expect(labels).not.toContain('Share availability');
        expect(labels).not.toContain('Edit your availability');
      });
    });

    describe('Past row', () => {
      const past = (overrides: Partial<FacilitatorRowProps> = {}) => facProps({
        courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', role: 'Facilitator' }),
        ...overrides,
      });

      test('shows "Share feedback" CTA when none submitted', () => {
        const { container } = renderFacRow(past());
        expect(inlineLabels(container)).toContain('Share feedback');
      });

      test('flips to "Edit feedback" once submitted', () => {
        const { container } = renderFacRow(past({ hasSubmittedFeedback: true }));
        expect(inlineLabels(container)).toContain('Edit feedback');
      });

      test('hides the feedback CTA when there is no meetPersonId', () => {
        const { container } = renderFacRow(past({ meetPersonId: null }));
        const labels = inlineLabels(container);
        expect(labels).not.toContain('Share feedback');
        expect(labels).not.toContain('Edit feedback');
      });

      test('past overflow keeps doc/slack/participants but drops Update discussion time', () => {
        const { container } = renderFacRow(past());
        const items = openOverflowItems(container);
        expect(items).toEqual(expect.arrayContaining(['Open discussion doc', 'Open Slack group', 'View participants']));
        expect(items).not.toContain('Update discussion time');
      });
    });

    describe('Active without a group (race condition between round start and assignment)', () => {
      test('View participants hidden', () => {
        const { container } = renderFacRow(facProps({ group: null }));
        expect(openOverflowItems(container)).not.toContain('View participants');
      });

      test('Update discussion time hidden', () => {
        const { container } = renderFacRow(facProps({ group: null }));
        expect(openOverflowItems(container)).not.toContain('Update discussion time');
      });
    });
  });

  describe('participant certificate / action-plan states', () => {
    test('completed + certificate + feedback outstanding → "Share feedback" to unlock (View certificate hidden)', () => {
      const { container } = renderRow(baseProps({
        courseRegistration: createMockCourseRegistration({
          roundStatus: 'Past',
          certificateCreatedAt: Math.floor(Date.now() / 1000),
          certificateId: 'cert-1',
        }),
        hasSubmittedFeedback: false,
        feedbackFormUrl: 'https://example.com/feedback',
      }));
      const labels = inlineLabels(container);
      expect(labels.some((l) => l.includes('Share feedback'))).toBe(true);
      expect(labels).not.toContain('View certificate');
    });

    test('completed + no certificate + action plan already submitted → "Action plan submitted"', () => {
      const { container } = renderRow(baseProps({
        courseRegistration: createMockCourseRegistration({ roundStatus: 'Past', certificateCreatedAt: null }),
        meetPersonId: 'mp-1',
        hasSubmittedActionPlan: true,
      }));
      expect(inlineLabels(container)).toContain('Action plan submitted');
    });

    test('in-progress + no certificate + missed too many discussions → certificate-eligibility tooltip shown', () => {
      renderRow(baseProps({
        courseRegistration: createMockCourseRegistration({ roundStatus: 'Active', certificateCreatedAt: null }),
        meetPersonId: 'mp-1',
        numUnits: 8,
        uniqueDiscussionAttendance: 2,
        hasSubmittedActionPlan: false,
      }));
      expect(screen.getByLabelText('Show certificate eligibility information')).toBeInTheDocument();
    });

    test('in-progress + attended enough + action plan submitted → no eligibility tooltip', () => {
      renderRow(baseProps({
        courseRegistration: createMockCourseRegistration({ roundStatus: 'Active', certificateCreatedAt: null }),
        meetPersonId: 'mp-1',
        numUnits: 8,
        uniqueDiscussionAttendance: 8,
        hasSubmittedActionPlan: true,
      }));
      expect(screen.queryByLabelText('Show certificate eligibility information')).toBeNull();
    });
  });
});
