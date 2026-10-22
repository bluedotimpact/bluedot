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

  const { totalCount } = prev.courseProgress;
  // Items in Optional chunks don't count, and an Option toggle can change which option counts.
  // For those, keep the course count and let the refetch update it. Other items move it by one.
  const isOptionOrOptional = unitNumber != null && chunkIndex != null
    && prev.chunkProgressByUnitNumber[unitNumber]?.[chunkIndex]?.isOptionOrOptional === true;
  const newCompleted = isOptionOrOptional
    ? prev.courseProgress.completedCount
    : clamp(prev.courseProgress.completedCount + delta, 0, totalCount);

  utils.courses.getCourseProgress.setData(
    { courseSlug },
    {
      ...prev,
      courseProgress: {
        ...prev.courseProgress,
        completedCount: newCompleted,
        percentage: percentage(newCompleted, totalCount),
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

// Same rule as the server: 100% only when every counted item is done
function percentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return completed === total ? 100 : Math.min(99, Math.round((completed / total) * 100));
}
