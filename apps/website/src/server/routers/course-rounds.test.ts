import {
  applicationsRoundTable,
  courseTable,
} from '@bluedot/db';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../__tests__/dbTestUtils';
import { getCourseRoundsData } from './course-rounds';

setupTestDb();

async function seedCourseAndRound(applicationDeadline: string) {
  await testDb.insert(courseTable, {
    id: 'course-1',
    slug: 'technical-ai-safety',
    title: 'Technical AI Safety',
    shortDescription: 'Test course',
    units: [],
  });

  await testDb.insert(applicationsRoundTable, {
    id: 'round-1',
    courseId: 'course-1',
    applicationDeadline,
    intensity: 'Intensive',
  });
}

describe('getCourseRoundsData', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('keeps a round visible throughout its deadline day', async () => {
    vi.setSystemTime(new Date('2026-04-12T23:59:00.000Z'));
    await seedCourseAndRound('2026-04-12');

    const rounds = await getCourseRoundsData('technical-ai-safety');

    expect(rounds.intense).toHaveLength(1);
    expect(rounds.intense[0]?.id).toBe('round-1');
  });

  test('hides a round once the deadline has passed everywhere in the world', async () => {
    vi.setSystemTime(new Date('2026-04-13T12:00:00.000Z'));
    await seedCourseAndRound('2026-04-12');

    const rounds = await getCourseRoundsData('technical-ai-safety');

    expect(rounds.intense).toHaveLength(0);
    expect(rounds.partTime).toHaveLength(0);
  });
});
