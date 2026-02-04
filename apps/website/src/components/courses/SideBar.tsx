import { InferSelectModel, unitTable } from '@bluedot/db';
import {
  A, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import clsx from 'clsx';
import React, { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import { trpc } from '../../utils/trpc';
import { CourseIcon } from './CourseIcon';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import { ChunkIcon } from '../icons/ChunkIcon';

type Unit = InferSelectModel<typeof unitTable.pg>;

type SideBarProps = {
  courseTitle: string;
  courseSlug: string;
  units: Unit[];
  currentUnitNumber: number;
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  unitChunks: Record<string, BasicChunk[]>;
  applyCTAProps?: ApplyCTAProps;
  className?: string;
};

type SideBarCollapsibleProps = {
  unit: Unit;
  isCurrentUnit: boolean;
  chunks: BasicChunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  courseSlug: string;
};

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
  chunks,
  currentChunkIndex,
  onChunkSelect,
  courseSlug,
}) => {
  const auth = useAuthStore((s) => s.auth);
  const [isExpanded, setIsExpanded] = useState(isCurrentUnit);
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

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

  // (5) Compute completion data per chunk (resources + exercises)
  const groupedCompletionData = chunks.map((chunk) => {
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
      (c) => c.completed && activeChunkExerciseIds.includes(c.exerciseId),
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

  return (
    <div className="relative">
      <div className="absolute top-0 inset-x-[24px] border-t-hairline border-[rgba(42,45,52,0.2)]" />
      <details
        open={isExpanded}
        onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
        className="sidebar-collapsible group marker:hidden [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex flex-row items-center mx-[24px] px-[24px] md:px-[12px] py-[15px] gap-[8px] text-left cursor-pointer hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px] transition-colors">
          <p className="font-semibold text-[14px] leading-[140%] tracking-[-0.005em] text-[#13132E] flex-1">
            {unit.unitNumber}. {unit.title}
          </p>
          <FaChevronRight className="size-[14px] transition-transform group-open:rotate-90 text-[#13132E]" />
        </summary>
        <div className="flex flex-col items-start px-0 pb-[16px] gap-[4px]">
          {chunks.map((chunk, index) => {
            const isActive = isCurrentUnit && currentChunkIndex === index;
            const chunkUrl = `/courses/${courseSlug}/${unit.unitNumber}/${index + 1}`;

            // For current unit, use button with onChunkSelect
            // For non-current unit, use link to navigate
            if (isCurrentUnit) {
              return (
                <button
                  type="button"
                  key={chunk.id}
                  onClick={() => onChunkSelect(index)}
                  className={clsx(
                    'flex flex-row items-center p-[16px] gap-[12px] mx-[24px] w-[calc(100%-48px)] text-left transition-colors',
                    isActive ? 'bg-[rgba(42,45,52,0.05)] rounded-[10px]' : 'hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px]',
                  )}
                >
                  <ChunkIcon isActive={isActive} />
                  <div className="flex flex-col items-start p-0 flex-1">
                    <div className="flex flex-col items-start gap-[6px]">
                      <p className="font-normal text-[14px] leading-[150%] text-[#13132E]">
                        {chunk.chunkTitle}
                      </p>
                    </div>
                    {chunk.estimatedTime && (
                      <div className="flex gap-1 text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#13132E] opacity-60 mt-[8px]">
                        <span>
                          {formatTime(chunk.estimatedTime)}
                        </span>
                        {auth && (
                          isLoading ? (
                            <ProgressDots className="my-0.5 ml-2" />
                          ) : (
                            groupedCompletionData[index] && groupedCompletionData[index].totalCount > 0 && (
                              <>
                                {/* Dot is outside of span so strikethrough doesn't extend to dot and look overly long */}
                                ⋅
                                <span className={clsx(groupedCompletionData[index].allCompleted && 'line-through')}>
                                  {groupedCompletionData[index].completedCount} of {groupedCompletionData[index].totalCount} completed
                                </span>
                              </>
                            )
                          )
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            }

            // Non-current unit: render as link
            return (
              <A
                key={chunk.id}
                href={chunkUrl}
                className={clsx(
                  'flex flex-row items-center p-[16px] gap-[12px] mx-[24px] w-[calc(100%-48px)] text-left transition-colors no-underline',
                  'hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px]',
                )}
              >
                <ChunkIcon isActive={false} />
                <div className="flex flex-col items-start p-0 flex-1">
                  <div className="flex flex-col items-start gap-[6px]">
                    <p className="font-normal text-[14px] leading-[150%] text-[#13132E]">
                      {chunk.chunkTitle}
                    </p>
                  </div>
                  {chunk.estimatedTime && (
                    <div className="flex gap-1 text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#13132E] opacity-60 mt-[8px]">
                      <span>
                        {formatTime(chunk.estimatedTime)}
                      </span>
                      {auth && (
                        isLoading ? (
                          <ProgressDots className="my-0.5 ml-2" />
                        ) : (
                          groupedCompletionData[index] && groupedCompletionData[index].totalCount > 0 && (
                            <>
                              ⋅
                              <span className={clsx(groupedCompletionData[index].allCompleted && 'line-through')}>
                                {groupedCompletionData[index].completedCount} of {groupedCompletionData[index].totalCount} completed
                              </span>
                            </>
                          )
                        )
                      )}
                    </div>
                  )}
                </div>
              </A>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export type ApplyCTAProps = {
  applicationDeadline: string;
  applicationUrl: string;
  hasApplied: boolean;
};

const ApplyCTA = ({ applicationDeadline, applicationUrl, hasApplied }: ApplyCTAProps) => {
  if (hasApplied) return null;

  return (
    <CTALinkOrButton
      url={applicationUrl}
      variant="outline-black"
      target="_blank"
      className="px-3 py-1.5 text-[14px]"
    >
      {`Apply by ${applicationDeadline}`}
    </CTALinkOrButton>
  );
};

const SideBar: React.FC<SideBarProps> = ({
  courseTitle,
  courseSlug,
  className,
  units,
  currentUnitNumber,
  currentChunkIndex,
  onChunkSelect,
  applyCTAProps,
  unitChunks,
}) => {
  const isCurrentUnit = (unit: Unit): boolean => {
    return !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  };

  return (
    <div className={clsx(
      'sidebar flex flex-col bg-color-canvas',
      'size-full md:w-[360px]',
      'border-r-[0.5px] border-color-divider',
      className,
    )}
    >
      {/* Header */}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex flex-row items-center gap-[16px]">
          <CourseIcon courseSlug={courseSlug} size="large" />
          <div className="flex flex-1 min-w-0">
            <h2 className="font-semibold text-[26px] leading-[44px] text-[#13132E]">{courseTitle}</h2>
          </div>
        </div>
        {applyCTAProps && <ApplyCTA {...applyCTAProps} />}
      </div>

      {/* Units */}
      <div className="flex-1 overflow-y-auto pb-6">
        {units.map((unit) => (
          <SideBarCollapsible
            key={unit.id}
            unit={unit}
            isCurrentUnit={isCurrentUnit(unit)}
            chunks={unitChunks[unit.id] ?? []}
            currentChunkIndex={currentChunkIndex}
            onChunkSelect={onChunkSelect}
            courseSlug={courseSlug}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
