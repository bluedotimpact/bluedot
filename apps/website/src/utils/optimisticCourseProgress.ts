import type { inferRouterOutputs } from '@trpc/server';
import type { trpc } from './trpc';
import type { AppRouter } from '../server/routers/_app';

type CourseProgressData = inferRouterOutputs<AppRouter>['courses']['getCourseProgress'];

export async function optimisticallyUpdateCourseProgress(
  utils: ReturnType<typeof trpc.useUtils>,
  courseSlug: string | undefined,
  unitNumber: string | undefined,
  chunkIndex: number | undefined,
  delta: 1 | -1,
) {
  if (!courseSlug) {
    return undefined;
  }

  await utils.courses.getCourseProgress.cancel({ courseSlug });
  const prev = utils.courses.getCourseProgress.getData({ courseSlug });

  if (!prev) {
    return undefined;
  }

  const newCompleted = clamp(prev.courseProgress.completedCount + delta, 0, prev.courseProgress.totalCount);

  utils.courses.getCourseProgress.setData(
    { courseSlug },
    {
      ...prev,
      courseProgress: {
        ...prev.courseProgress,
        completedCount: newCompleted,
        percentage: prev.courseProgress.totalCount > 0 ? Math.round((newCompleted / prev.courseProgress.totalCount) * 100) : 0,
      },
      chunkProgressByUnitNumber: {
        ...prev.chunkProgressByUnitNumber,
        ...(unitNumber != null && chunkIndex != null
          ? {
            [unitNumber]:
                  prev.chunkProgressByUnitNumber[unitNumber]?.map((chunkProgress, i) => {
                    if (i !== chunkIndex) {
                      return chunkProgress;
                    }

                    const newChunkCompleted = clamp(chunkProgress.completedCount + delta, 0, chunkProgress.totalCount);

                    return {
                      ...chunkProgress,
                      completedCount: newChunkCompleted,
                      allCompleted: newChunkCompleted === chunkProgress.totalCount && chunkProgress.totalCount > 0,
                    };
                  }) ?? [],
          }
          : {}),
      },
    },
  );
  return prev;
}

export function rollbackCourseProgress(
  utils: ReturnType<typeof trpc.useUtils>,
  courseSlug: string | undefined,
  previousData: CourseProgressData | undefined,
) {
  if (courseSlug && previousData) {
    utils.courses.getCourseProgress.setData({ courseSlug }, previousData);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
