import { describe, test, expect } from 'vitest';
import type { CourseRegistration } from '@bluedot/db';
import { createMockCourseRegistration } from '../testUtils';
import { bucketCoursesByTab } from '../../pages/my-courses';
import type { ParticipantRowProps } from '../../components/my-courses/CourseListRow';

const makeRow = (
  crOverrides: Partial<CourseRegistration> = {},
  rowOverrides: Partial<ParticipantRowProps> = {},
): ParticipantRowProps => ({
  mode: 'participant',
  courseRegistration: createMockCourseRegistration(crOverrides),
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: null,
  facilitatorNames: [],
  meetPersonId: null,
  groupsAsParticipant: null,
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
  isDroppedOut: false,
  isDeferred: false,
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
        rs: 'Past', d: 'Accept', drop: false, defer: true, cert: true, tab: 'pastCourses', why: 'certificate outranks a stale deferral',
      },
      {
        rs: 'Past', d: 'Accept', drop: false, defer: true, cert: false, tab: null, why: 'deferred away without cert stays hidden (superseded by successor)',
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
      {
        rs: null, d: 'Accept', drop: false, defer: true, cert: true, tab: 'pastCourses', why: 'deferred + null roundStatus falls to the cert branch → certificate outranks the stale deferral',
      },
      {
        rs: null, d: 'Accept', drop: false, defer: true, cert: false, tab: null, why: 'deferred + null roundStatus + no cert stays hidden',
      },
    ])('rs=$rs, d=$d, drop=$drop, defer=$defer, cert=$cert → $tab', ({
      rs, d, drop, defer, cert, tab,
    }) => {
      const row = makeRow({
        roundStatus: rs,
        decision: d,
        certificateCreatedAt: cert ? 1234 : null,
      }, {
        // The aggregator now sources these from the dropout table, but for the bucketing logic
        // we just need the resolved flags. Mirror the old "deferral wins" precedence.
        isDroppedOut: drop && !defer,
        isDeferred: defer,
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

  // Future of AI is self-serve: its rows have no round, so roundStatus is always null and decision
  // is never set. These two are the ONLY states a FoAI course currently surfaces in on My Courses.
  // The enrolled-but-incomplete state being invisible is the known ~broken behaviour — update these
  // tests deliberately if/when that changes.
  describe('Future of AI (self-serve) states', () => {
    const foaiRow = (certificateCreatedAt: number | null): ParticipantRowProps => makeRow({
      roundStatus: null,
      decision: null,
      certificateCreatedAt,
      certificateId: certificateCreatedAt ? 'cert-foai' : null,
    });

    test('enrolled without a certificate → not shown in any tab', () => {
      const buckets = bucketCoursesByTab([foaiRow(null)]);
      expect([...buckets.inProgress, ...buckets.upcoming, ...buckets.pastCourses]).toHaveLength(0);
    });

    test('completed (has certificate) → Past Courses only', () => {
      const buckets = bucketCoursesByTab([foaiRow(1700000000)]);
      expect(buckets.pastCourses).toHaveLength(1);
      expect(buckets.inProgress).toHaveLength(0);
      expect(buckets.upcoming).toHaveLength(0);
    });
  });
});
