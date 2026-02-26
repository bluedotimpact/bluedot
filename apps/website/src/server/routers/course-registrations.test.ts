import { describe, expect, test } from 'vitest';
import { courseRegistrationTable } from '@bluedot/db';
import { setupDbTests, createCaller, testDb } from '../../__tests__/dbTestUtils';

setupDbTests();

describe('courseRegistrations router', () => {
  test('getAll returns course registrations from the database', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'rec001',
      email: 'test@example.com',
      courseId: 'course-1',
      decision: 'Accept',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'rec002',
      email: 'test@example.com',
      courseId: 'course-2',
      decision: 'Withdrawn',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'rec003',
      email: 'other@example.com',
      courseId: 'course-1',
      decision: 'Accept',
    });

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
