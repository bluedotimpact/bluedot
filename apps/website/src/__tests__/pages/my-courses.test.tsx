import { describe, test, expect } from 'vitest';
import type { CourseRegistration } from '@bluedot/db';
import { createMockCourseRegistration } from '../testUtils';
import { bucketCoursesByTab } from '../../pages/my-courses';
import type { CourseRowData } from '../../components/my-courses/CourseListRow';

const makeRow = (
  crOverrides: Partial<CourseRegistration> = {},
  rowOverrides: Partial<CourseRowData> = {},
): CourseRowData => ({
  courseRegistration: createMockCourseRegistration(crOverrides),
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: null,
  facilitatorNames: [],
  meetPersonId: null,
  roundId: null,
  discussions: [],
  attendedDiscussionIds: [],
  units: {},
  roundStartDate: null,
  roundEndDate: null,
  rescheduleEligibleUnits: [],
  numUnits: null,
  uniqueDiscussionAttendance: null,
  hasSubmittedActionPlan: false,
  feedbackFormUrl: null,
  hasSubmittedFeedback: false,
  ...rowOverrides,
});

describe('bucketCoursesByTab', () => {
  test('returns empty buckets for undefined or empty input', () => {
    const empty = { inProgress: [], upcoming: [], pastCourses: [] };
    expect(bucketCoursesByTab(undefined)).toEqual(empty);
    expect(bucketCoursesByTab([])).toEqual(empty);
  });

  describe('tab assignment', () => {
    type Tab = 'inProgress' | 'upcoming' | 'pastCourses';
    type Case = {
      rs: CourseRegistration['roundStatus'];
      d: CourseRegistration['decision'];
      drop: boolean;
      defer: boolean;
      cert: boolean;
      tab: Tab | null;
      why?: string;
    };

    test.each<Case>([
      // Active
      {
        rs: 'Active', d: 'Accept', drop: false, defer: false, cert: false, tab: 'inProgress',
      },
      {
        rs: 'Active', d: 'Accept', drop: true, defer: false, cert: false, tab: 'pastCourses', why: 'dropped overrides Active',
      },
      {
        rs: 'Active', d: 'Accept', drop: true, defer: true, cert: false, tab: 'inProgress', why: 'deferred overrides dropped',
      },
      {
        rs: 'Active', d: 'Reject', drop: false, defer: false, cert: false, tab: null, why: 'rejection only visible while Future',
      },

      // Future
      {
        rs: 'Future', d: 'Accept', drop: false, defer: false, cert: false, tab: 'upcoming',
      },
      {
        rs: 'Future', d: 'Reject', drop: false, defer: false, cert: false, tab: 'upcoming', why: 'rejection visible while Future',
      },
      {
        rs: 'Future', d: null, drop: false, defer: false, cert: false, tab: 'upcoming',
      },
      {
        rs: 'Future', d: 'Accept', drop: true, defer: false, cert: false, tab: 'pastCourses', why: 'dropped overrides Future',
      },
      {
        rs: 'Future', d: 'Accept', drop: true, defer: true, cert: false, tab: 'upcoming', why: 'deferred overrides dropped',
      },

      // Past
      {
        rs: 'Past', d: 'Accept', drop: false, defer: false, cert: false, tab: 'pastCourses',
      },
      {
        rs: 'Past', d: 'Accept', drop: false, defer: false, cert: true, tab: 'pastCourses',
      },
      {
        rs: 'Past', d: 'Reject', drop: false, defer: false, cert: false, tab: null, why: 'rejection only visible while Future',
      },

      // Null roundStatus
      {
        rs: null, d: 'Accept', drop: false, defer: false, cert: true, tab: 'pastCourses', why: 'cert keeps null-roundStatus eligible',
      },
      {
        rs: null, d: 'Accept', drop: false, defer: false, cert: false, tab: null, why: 'no roundStatus + no cert is filtered out (FOAI bug — update when fixed)',
      },
    ])('rs=$rs, d=$d, drop=$drop, defer=$defer, cert=$cert → $tab', ({
      rs, d, drop, defer, cert, tab,
    }) => {
      const row = makeRow({
        roundStatus: rs,
        decision: d,
        dropoutId: drop ? ['dropout-x'] : null,
        deferredId: defer ? ['defer-x'] : null,
        certificateCreatedAt: cert ? 1234 : null,
      });
      const buckets = bucketCoursesByTab([row]);
      const allRows = [...buckets.inProgress, ...buckets.upcoming, ...buckets.pastCourses];
      if (tab === null) {
        expect(allRows).toHaveLength(0);
      } else {
        expect(allRows).toHaveLength(1);
        expect(buckets[tab]).toHaveLength(1);
      }
    });
  });
});
