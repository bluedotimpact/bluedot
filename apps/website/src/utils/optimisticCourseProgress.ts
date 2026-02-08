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
  if (!courseSlug) return undefined;

  await utils.courses.getCourseProgress.cancel({ courseSlug });
  const prev = utils.courses.getCourseProgress.getData({ courseSlug });

  if (!prev) return undefined;

  const newCompleted = prev.courseProgress.completedCount + delta;
  utils.courses.getCourseProgress.setData(
    { courseSlug },
    {
      ...prev,
      courseProgress: {
        ...prev.courseProgress,
        completedCount: newCompleted,
        percentage: prev.courseProgress.totalCount > 0  ? Math.round((newCompleted / prev.courseProgress.totalCount) * 100) : 0,
      },
      chunkProgressByUnitNumber: {
        ...prev.chunkProgressByUnitNumber,
        ...(unitNumber != null && chunkIndex != null
          ? {
            [unitNumber]:
                  prev.chunkProgressByUnitNumber[unitNumber]?.map((chunkProgress, i) => (i === chunkIndex
                    ? {
                      ...chunkProgress,
                      completedCount: chunkProgress.completedCount + delta,
                      allCompleted: chunkProgress.completedCount + delta >= chunkProgress.totalCount,
                    }
                    : chunkProgress)) ?? [],
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
