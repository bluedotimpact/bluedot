import { useAuthStore } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';

export type ChunkProgress = {
  totalCount: number;
  completedCount: number;
  allCompleted: boolean;
};

/**
 * Fetches and computes progress for chunks (resources + exercises).
 * Lazy-loads data only when isExpanded is true.
 */
export function useChunkProgress(chunks: BasicChunk[], isExpanded: boolean) {
  const auth = useAuthStore((s) => s.auth);

  const allResourceIds = chunks.flatMap((c) => c.chunkResources ?? []);
  const allExerciseIds = chunks.flatMap((c) => c.chunkExercises ?? []);

  // (1) Lazy-load core resource IDs
  const { data: coreResourceIds, isLoading: coreResourcesLoading } = trpc.resources.getCoreResourceIds.useQuery(
    { resourceIds: allResourceIds },
    { enabled: isExpanded && allResourceIds.length > 0 },
  );

  // (2) Lazy-load active exercise IDs
  const { data: activeExerciseIds, isLoading: activeExercisesLoading } = trpc.exercises.getActiveExerciseIds.useQuery(
    { exerciseIds: allExerciseIds },
    { enabled: isExpanded && allExerciseIds.length > 0 },
  );

  // (3) Core resource completions
  const { data: resourceCompletions, isLoading: resourceCompletionsLoading } = trpc.resources.getResourceCompletions.useQuery({
    unitResourceIds: coreResourceIds ?? [],
  }, {
    enabled: isExpanded && (coreResourceIds?.length ?? 0) > 0 && Boolean(auth),
  });

  // (4) Active exercise completions
  const { data: exerciseCompletions, isLoading: exerciseCompletionsLoading } = trpc.exercises.getExerciseCompletions.useQuery(
    { exerciseIds: activeExerciseIds ?? [] },
    { enabled: isExpanded && (activeExerciseIds?.length ?? 0) > 0 && Boolean(auth) },
  );

  const coreResourceIdSet = new Set(coreResourceIds ?? []);
  const activeExerciseIdSet = new Set(activeExerciseIds ?? []);

  // Compute progress per chunk (resources + exercises)
  const chunkProgress: ChunkProgress[] = chunks.map((chunk) => {
    // Resource completion
    const chunkResourceIds = chunk.chunkResources ?? [];
    const coreChunkResourceIds = chunkResourceIds.filter((id) => coreResourceIdSet.has(id));
    const resourceCompletedCount = resourceCompletions?.filter(
      (c) => c.isCompleted && c.unitResourceId && coreChunkResourceIds.includes(c.unitResourceId),
    ).length ?? 0;

    // Exercise completion (only active exercises count)
    const chunkExerciseIds = chunk.chunkExercises ?? [];
    const activeChunkExerciseIds = chunkExerciseIds.filter((id) => activeExerciseIdSet.has(id));
    const exerciseCompletedCount = exerciseCompletions?.filter(
      (c) => c.completedAt && activeChunkExerciseIds.includes(c.exerciseId),
    ).length ?? 0;

    // Combined totals
    const totalCount = coreChunkResourceIds.length + activeChunkExerciseIds.length;
    const completedCount = resourceCompletedCount + exerciseCompletedCount;

    return {
      totalCount,
      completedCount,
      allCompleted: completedCount === totalCount && totalCount > 0,
    };
  });

  const isLoading = coreResourcesLoading || activeExercisesLoading || resourceCompletionsLoading || exerciseCompletionsLoading;

  return { chunkProgress, isLoading };
}
