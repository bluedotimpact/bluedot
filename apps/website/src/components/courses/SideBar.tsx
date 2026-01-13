import { InferSelectModel, unitTable } from '@bluedot/db';
import {
  A, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import clsx from 'clsx';
import React from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import { trpc } from '../../utils/trpc';
import { filterResourcesByType } from './ResourceDisplay';
import type { ChunkWithContent } from './UnitLayout';
import { CourseIcon } from './CourseIcon';

type Unit = InferSelectModel<typeof unitTable.pg>;

type SideBarProps = {
  // Required
  courseTitle: string;
  courseSlug: string;
  units: Unit[];
  currentUnitNumber: number;
  chunks: ChunkWithContent[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  // Optional
  applyCTAProps?: ApplyCTAProps;
  className?: string;
};

type SideBarCollapsibleProps = {
  unit: Unit;
  isCurrentUnit: boolean;
  chunks: ChunkWithContent[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
};

// Radio button style icon for chunk selection
const ChunkIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => {
  if (isActive) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1Z" stroke="#13132E" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" fill="#13132E" />
      </svg>
    );
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1Z" stroke="rgba(106,111,122,0.3)" strokeWidth="2" />
    </svg>
  );
};

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
  chunks,
  currentChunkIndex,
  onChunkSelect,
}) => {
  const auth = useAuthStore((s) => s.auth);
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  const coreResources = chunks.flatMap((chunk) => filterResourcesByType(chunk.resources, 'Core'));

  const { data: resourceCompletions, isLoading: resourceCompletionsLoading } = trpc.resources.getResourceCompletions.useQuery({
    unitResourceIds: coreResources.map((resource) => resource.id),
  }, {
    enabled: isCurrentUnit && coreResources.length > 0 && Boolean(auth),
  });

  // For each chunk we need to know (1) how many core resources there are and (2) how many have been completed
  const groupedResourceCompletionData = chunks.map((chunk) => {
    const coreChunkResources = filterResourcesByType(chunk.resources, 'Core');
    const coreResourceIds = new Set(coreChunkResources.map((resource) => resource.id));
    const completedCoreResources = resourceCompletions?.filter((completion) => completion.isCompleted && completion.unitResourceId && coreResourceIds.has(completion.unitResourceId)) || [];

    return {
      chunkCoreResources: coreChunkResources,
      completedCoreResources,
      allResourcesCompleted: completedCoreResources.length === coreChunkResources.length && coreChunkResources.length > 0,
    };
  });

  return (
    isCurrentUnit ? (
      <div className="relative">
        <div className="absolute top-0 inset-x-[24px] border-t-hairline border-[rgba(42,45,52,0.2)]" />
        <details
          open={isCurrentUnit}
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
              const isActive = currentChunkIndex === index;
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
                    {/* Chunk content wrapper with proper spacing */}
                    <div className="flex flex-col items-start gap-[6px]">
                      {/* Chunk Title */}
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
                          resourceCompletionsLoading ? (
                            <ProgressDots className="my-0.5 ml-2" />
                          ) : (
                            groupedResourceCompletionData[index] && groupedResourceCompletionData[index].chunkCoreResources.length > 0 && (
                              <>
                                {/* Dot is outside of span so strikethrough doesn't extend to dot and look overly long */}
                                ⋅
                                <span className={clsx(groupedResourceCompletionData[index].allResourcesCompleted && 'line-through')}>
                                  {groupedResourceCompletionData[index].completedCoreResources.length} of {groupedResourceCompletionData[index].chunkCoreResources.length} completed
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
            })}
          </div>
        </details>
      </div>
    ) : (
      <div className="relative">
        <div className="absolute top-0 inset-x-[24px] border-t-hairline border-[rgba(42,45,52,0.2)]" />
        <A href={unit.path} className="block mx-[24px] px-[24px] md:px-[12px] py-[15px] no-underline hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px] transition-colors">
          <div className="flex flex-row items-center gap-[8px]">
            <p className="font-semibold text-[14px] leading-[140%] tracking-[-0.005em] text-[#13132E] flex-1">
              {unit.unitNumber}. {unit.title}
            </p>
            <FaChevronRight className="size-[14px] text-[#13132E]" />
          </div>
        </A>
      </div>
    )
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
  chunks,
  currentChunkIndex,
  onChunkSelect,
  applyCTAProps,
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
            chunks={isCurrentUnit(unit) ? chunks : []}
            currentChunkIndex={currentChunkIndex}
            onChunkSelect={onChunkSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
