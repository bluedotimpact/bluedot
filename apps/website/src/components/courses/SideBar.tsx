import type { Unit } from '@bluedot/db';
import {
  A, CTALinkOrButton, P,
} from '@bluedot/ui';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import type { ChunkProgress, CourseProgress } from '../../server/routers/courses';
import { ChunkIcon } from '../icons/ChunkIcon';
import { CourseIcon } from './CourseIcon';

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
  courseProgressData?: CourseProgress;
};

type SideBarCollapsibleProps = {
  unit: Unit;
  isCurrentUnit: boolean;
  chunks: BasicChunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  courseSlug: string;
  chunkProgress: ChunkProgress[];
};

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
  chunks,
  currentChunkIndex,
  onChunkSelect,
  courseSlug,
  chunkProgress,
}) => {
  const [isExpanded, setIsExpanded] = useState(isCurrentUnit);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  useEffect(() => {
    if (isExpanded && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);

  return (
    <div className="relative">
      <div className="absolute top-0 inset-x-[24px] border-t-hairline border-[rgba(42,45,52,0.2)]" />
      <details
        ref={detailsRef}
        open={isExpanded}
        onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
        className="sidebar-collapsible group marker:hidden [&_summary::-webkit-details-marker]:hidden scroll-mb-5"
      >
        <summary className="flex flex-row items-center mx-[24px] px-[24px] md:px-[12px] py-[15px] gap-[8px] text-left cursor-pointer hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px] transition-colors">
          <p className="font-semibold text-[14px] leading-[140%] tracking-[-0.005em] text-bluedot-navy flex-1">
            {unit.unitNumber}. {unit.title}
          </p>
          <FaChevronRight className="size-[14px] transition-transform group-open:rotate-90 text-bluedot-navy" />
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
                      <p className="font-normal text-[14px] leading-[150%] text-bluedot-navy">
                        {chunk.chunkTitle}
                      </p>
                    </div>
                    {chunk.estimatedTime && (
                      <div className="flex gap-1 text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-bluedot-navy/60 mt-[8px]">
                        <span>
                          {formatTime(chunk.estimatedTime)}
                        </span>
                        {chunkProgress[index] && chunkProgress[index].totalCount > 0 && (
                          <>
                            {/* Dot is outside of span so strikethrough doesn't extend to dot and look overly long */}
                            ⋅
                            <span className={clsx(chunkProgress[index].allCompleted && 'line-through')}>
                              {chunkProgress[index].completedCount} of {chunkProgress[index].totalCount} completed
                            </span>
                          </>
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
                    <p className="font-normal text-[14px] leading-[150%] text-bluedot-navy">
                      {chunk.chunkTitle}
                    </p>
                  </div>
                  {chunk.estimatedTime && (
                    <div className="flex gap-1 text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-bluedot-navy/60 mt-[8px]">
                      <span>
                        {formatTime(chunk.estimatedTime)}
                      </span>
                      {chunkProgress[index] && chunkProgress[index].totalCount > 0 && (
                        <>
                          ⋅
                          <span className={clsx(chunkProgress[index].allCompleted && 'line-through')}>
                            {chunkProgress[index].completedCount} of {chunkProgress[index].totalCount} completed
                          </span>
                        </>
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
  if (hasApplied) {
    return null;
  }

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
  courseProgressData,
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
          <CourseIcon courseSlug={courseSlug} size="xlarge" />
          <div className="flex flex-1 min-w-0">
            <div className="flex flex-col">
              <h2 className="font-semibold text-[26px] leading-[44px] text-bluedot-navy">{courseTitle}</h2>
              {courseProgressData && courseProgressData.courseProgress.totalCount > 0 && (
                <P className="opacity-60">{courseProgressData.courseProgress.percentage}% completed</P>
              )}
            </div>
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
            chunkProgress={courseProgressData?.chunkProgressByUnitNumber[unit.unitNumber] ?? []}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
