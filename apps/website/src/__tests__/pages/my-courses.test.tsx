import { describe, test, expect } from 'vitest';
import type { CourseRegistration } from '@bluedot/db';
import { createMockCourseRegistration } from '../testUtils';
import { bucketCoursesByTab } from '../../pages/my-courses';
import type { CourseRowData } from '../../components/my-courses/CourseListRow';

const makeRow = (crOverrides: Partial<CourseRegistration> = {}): CourseRowData => ({
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
});

describe('bucketCoursesByTab exclusivity', () => {
  test('Future + Accept + dropoutId (non-deferred) lands in past-courses only', () => {
    const row = makeRow({
      roundStatus: 'Future', decision: 'Accept', dropoutId: ['drop_1'], deferredId: null,
    });
    const buckets = bucketCoursesByTab([row]);
    expect(buckets['past-courses']).toHaveLength(1);
    expect(buckets.upcoming).toHaveLength(0);
    expect(buckets['in-progress']).toHaveLength(0);
  });

  test('Active + Accept + dropoutId (non-deferred) lands in past-courses only', () => {
    const row = makeRow({
      roundStatus: 'Active', decision: 'Accept', dropoutId: ['drop_1'], deferredId: null,
    });
    const buckets = bucketCoursesByTab([row]);
    expect(buckets['past-courses']).toHaveLength(1);
    expect(buckets['in-progress']).toHaveLength(0);
    expect(buckets.upcoming).toHaveLength(0);
  });

  test('Future + Accept (no dropoutId) lands in upcoming only', () => {
    const row = makeRow({
      roundStatus: 'Future', decision: 'Accept', dropoutId: null, deferredId: null,
    });
    const buckets = bucketCoursesByTab([row]);
    expect(buckets.upcoming).toHaveLength(1);
    expect(buckets['in-progress']).toHaveLength(0);
    expect(buckets['past-courses']).toHaveLength(0);
  });

  test('Past (no dropoutId) lands in past-courses only', () => {
    const row = makeRow({
      roundStatus: 'Past', decision: 'Accept', dropoutId: null, deferredId: null,
    });
    const buckets = bucketCoursesByTab([row]);
    expect(buckets['past-courses']).toHaveLength(1);
    expect(buckets['in-progress']).toHaveLength(0);
    expect(buckets.upcoming).toHaveLength(0);
  });

  test('Deferred row (dropoutId AND deferredId set) follows normal roundStatus path, NOT past-courses', () => {
    // roundStatus: 'Active' + both ids set → should be treated as in-progress, not past.
    const row = makeRow({
      roundStatus: 'Active', decision: 'Accept', dropoutId: ['drop_1'], deferredId: ['def_1'],
    });
    const buckets = bucketCoursesByTab([row]);
    expect(buckets['past-courses']).toHaveLength(0);
    expect(buckets['in-progress']).toHaveLength(1);
    expect(buckets.upcoming).toHaveLength(0);
  });

  test('mixed registrations: total across buckets equals total input (no duplication, no loss)', () => {
    const rows: CourseRowData[] = [
      makeRow({ roundStatus: 'Future', decision: 'Accept' }),
      makeRow({
        roundStatus: 'Future', decision: 'Accept', dropoutId: ['drop_1'], deferredId: null,
      }),
      makeRow({ roundStatus: 'Active', decision: 'Accept' }),
      makeRow({
        roundStatus: 'Active', decision: 'Accept', dropoutId: ['drop_2'], deferredId: null,
      }),
      makeRow({ roundStatus: 'Past', decision: 'Accept' }),
    ];
    const buckets = bucketCoursesByTab(rows);
    const total = buckets['in-progress'].length + buckets.upcoming.length + buckets['past-courses'].length;
    expect(total).toBe(rows.length);
    expect(buckets['in-progress']).toHaveLength(1);
    expect(buckets.upcoming).toHaveLength(1);
    expect(buckets['past-courses']).toHaveLength(3);
  });
});
