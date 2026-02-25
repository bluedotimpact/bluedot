import { describe, expect, test } from 'vitest';
import { courseRegistrationTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { appRouter } from './_app';
import type { Context } from '../context';

const mockContext: Context = {
  auth: {
    email: 'test@example.com',
    sub: 'test-sub',
    iss: 'test-issuer',
    aud: 'test-audience',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
  },
  impersonation: null,
  userAgent: 'test-agent',
};

describe('courseRegistrations router', () => {
  test('getAll returns course registrations from the database', async () => {
    // Insert test data directly into PGlite
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

    const caller = appRouter.createCaller(mockContext);
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
