import { describe, expect, test } from 'vitest';
import { courseRegistrationTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { setupDbTests, createCaller } from '../../__tests__/dbTestUtils';

setupDbTests();

describe('courseRegistrations router', () => {
  test('getAll returns course registrations from the database', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'rec001',
        email: 'test@example.com',
        courseId: 'course-1',
        decision: 'Accept',
      },
      {
        id: 'rec002',
        email: 'test@example.com',
        courseId: 'course-2',
        decision: 'Withdrawn',
      },
      {
        id: 'rec003',
        email: 'other@example.com',
        courseId: 'course-1',
        decision: 'Accept',
      },
    ]);

    const caller = createCaller();
    const results = await caller.courseRegistrations.getAll();

    // Should only return non-withdrawn registrations for test@example.com
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'rec001',
      email: 'test@example.com',
      courseId: 'course-1',
      decision: 'Accept',
    });
  });
});
