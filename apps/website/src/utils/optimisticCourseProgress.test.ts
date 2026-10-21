import { describe, expect, test } from 'vitest';
import { optimisticallyUpdateCourseProgress } from './optimisticCourseProgress';

type Utils = Parameters<typeof optimisticallyUpdateCourseProgress>[0];

const fakeUtils = (completedCount: number, totalCount: number) => {
  let data = {
    courseProgress: { totalCount, completedCount, percentage: Math.round((completedCount / totalCount) * 100) },
    chunkProgressByUnitNumber: {
      1: [
        {
          totalCount: 2, completedCount: 0, allCompleted: false, isOptionOrOptional: false,
        },
        {
          totalCount: 2, completedCount: 0, allCompleted: false, isOptionOrOptional: true,
        },
      ],
    },
  };
  const utils = {
    courses: {
      getCourseProgress: {
        cancel: async () => {},
        getData: () => data,
        setData: (_input: unknown, next: typeof data) => {
          data = next;
        },
      },
    },
  };
  return { utils: utils as unknown as Utils, get: () => data };
};

describe('optimisticallyUpdateCourseProgress', () => {
  test('a regular chunk moves the course count by one', async () => {
    const { utils, get } = fakeUtils(1, 4);
    await optimisticallyUpdateCourseProgress(utils, 'c', '1', 0, 1);
    expect(get().courseProgress).toEqual({ totalCount: 4, completedCount: 2, percentage: 50 });
    expect(get().chunkProgressByUnitNumber[1]?.[0]?.completedCount).toBe(1);
  });

  test('an Option or Optional chunk keeps the course count for the server to update', async () => {
    const { utils, get } = fakeUtils(1, 4);
    await optimisticallyUpdateCourseProgress(utils, 'c', '1', 1, 1);
    expect(get().courseProgress).toEqual({ totalCount: 4, completedCount: 1, percentage: 25 });
    expect(get().chunkProgressByUnitNumber[1]?.[1]?.completedCount).toBe(1);
  });

  test('un-completing at 100% keeps the count, since bonus items may still cover it', async () => {
    const { utils, get } = fakeUtils(4, 4);
    await optimisticallyUpdateCourseProgress(utils, 'c', '1', 0, -1);
    expect(get().courseProgress).toEqual({ totalCount: 4, completedCount: 4, percentage: 100 });
  });
});
