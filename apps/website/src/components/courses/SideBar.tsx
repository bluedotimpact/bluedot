import { InferSelectModel, unitTable } from '@bluedot/db';
import { ProgressDots, useAuthStore } from '@bluedot/ui';
import clsx from 'clsx';
import React from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import { trpc } from '../../utils/trpc';
import { A } from '../Text';
import { filterResourcesByType } from './ResourceDisplay';
import type { ChunkWithContent } from './UnitLayout';
import { COURSE_ICONS } from '../../lib/constants';

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
    const completedCoreResources = resourceCompletions?.filter((completion) => completion.isCompleted && coreResourceIds.has(completion.unitResourceIdRead)) || [];

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

const SideBar: React.FC<SideBarProps> = ({
  courseTitle,
  courseSlug,
  className,
  units,
  currentUnitNumber,
  chunks,
  currentChunkIndex,
  onChunkSelect,
}) => {
  const isCurrentUnit = (unit: Unit): boolean => {
    return !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  };

  const iconSrc = COURSE_ICONS[courseSlug];

  return (
    <div className={clsx(
      'sidebar flex flex-col bg-color-canvas',
      'size-full md:w-[360px]',
      'border-r-[0.5px] border-color-divider',
      className,
    )}
    >
      {/* Header */}
      <div className="p-[24px]">
        <div className="flex flex-row items-center gap-[16px]">
          {iconSrc ? (
            <div className="size-11 rounded-[8px] bg-[#1144cc] flex items-center justify-center flex-shrink-0">
              <img src={iconSrc} alt="" className="size-7" />
            </div>
          ) : (
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect className="fill-bluedot-normal" width="44" height="44" rx="8" />
              <path d="M33.9941 23.4938L30.4941 26.9938C30.3299 27.158 30.1072 27.2502 29.875 27.2502C29.6428 27.2502 29.4201 27.158 29.2559 26.9938C29.0918 26.8296 28.9995 26.6069 28.9995 26.3747C28.9995 26.1425 29.0918 25.9198 29.2559 25.7556L31.263 23.7497H21.487L15.362 29.8747H18.5C18.7321 29.8747 18.9546 29.9669 19.1187 30.131C19.2828 30.2951 19.375 30.5176 19.375 30.7497C19.375 30.9818 19.2828 31.2043 19.1187 31.3684C18.9546 31.5325 18.7321 31.6247 18.5 31.6247H13.25C13.0179 31.6247 12.7954 31.5325 12.6313 31.3684C12.4672 31.2043 12.375 30.9818 12.375 30.7497V25.4997C12.375 25.2676 12.4672 25.0451 12.6313 24.881C12.7954 24.7169 13.0179 24.6247 13.25 24.6247C13.4821 24.6247 13.7046 24.7169 13.8687 24.881C14.0328 25.0451 14.125 25.2676 14.125 25.4997V28.6377L20.25 22.5127V12.7367L18.2441 14.7438C18.0799 14.908 17.8572 15.0002 17.625 15.0002C17.3928 15.0002 17.1701 14.908 17.0059 14.7438C16.8418 14.5796 16.7495 14.3569 16.7495 14.1247C16.7495 13.8925 16.8418 13.6698 17.0059 13.5056L20.5059 10.0056C20.5872 9.92429 20.6837 9.85976 20.7899 9.81572C20.8961 9.77169 21.01 9.74902 21.125 9.74902C21.24 9.74902 21.3538 9.77169 21.4601 9.81572C21.5663 9.85976 21.6628 9.92429 21.7441 10.0056L25.2441 13.5056C25.4082 13.6698 25.5005 13.8925 25.5005 14.1247C25.5005 14.3569 25.4082 14.5796 25.2441 14.7438C25.0799 14.908 24.8572 15.0002 24.625 15.0002C24.3928 15.0002 24.1701 14.908 24.0059 14.7438L22 12.7367V21.9997H31.263L29.2559 19.9938C29.0918 19.8296 28.9995 19.6069 28.9995 19.3747C28.9995 19.1425 29.0918 18.9198 29.2559 18.7556C29.4201 18.5915 29.6428 18.4992 29.875 18.4992C30.1072 18.4992 30.3299 18.5915 30.4941 18.7556L33.9941 22.2556C34.0754 22.3369 34.14 22.4334 34.184 22.5396C34.228 22.6459 34.2507 22.7597 34.2507 22.8747C34.2507 22.9897 34.228 23.1036 34.184 23.2098C34.14 23.316 34.0754 23.4125 33.9941 23.4938Z" fill="white" />
            </svg>
          )}
          <div className="flex flex-1 min-w-0">
            <h2 className="font-semibold text-[26px] leading-[44px] text-[#13132E]">{courseTitle}</h2>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="flex-1 overflow-y-auto">
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
