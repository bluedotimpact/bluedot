import type { Unit } from '@bluedot/db';
import {
  CTALinkOrButton, Modal,
} from '@bluedot/ui';
import clsx from 'clsx';
import React, { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import type { ChunkProgress, CourseProgress } from '../../server/routers/courses';
import { ChunkIcon } from '../icons/ChunkIcon';
import { CourseIcon } from './CourseIcon';
import type { ApplyCTAProps } from './SideBar';

type MobileCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  courseTitle: string;
  courseSlug: string;
  units: Unit[];
  currentUnitNumber: number;
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  onUnitSelect?: (unitPath: string) => void;
  unitChunks: Record<string, BasicChunk[]>;
  applyCTAProps?: ApplyCTAProps;
  courseProgressData?: CourseProgress;
};

export const MobileCourseModal: React.FC<MobileCourseModalProps> = ({
  isOpen,
  setIsOpen,
  courseTitle,
  courseSlug,
  units,
  currentUnitNumber,
  currentChunkIndex,
  onChunkSelect,
  onUnitSelect,
  unitChunks,
  applyCTAProps,
  courseProgressData,
}) => {
  // Track which units are expanded (current unit starts expanded)
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(() => {
    const currentUnit = units.find((u) => Number(u.unitNumber) === currentUnitNumber);
    return currentUnit ? new Set([currentUnit.id]) : new Set();
  });

  const isCurrentUnit = (unit: Unit): boolean => {
    return !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  };

  const toggleUnitExpansion = (unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const handleChunkClick = (unit: Unit, index: number) => {
    if (isCurrentUnit(unit)) {
      // For current unit, use onChunkSelect to update chunk index state without a page reload
      onChunkSelect(index);
    } else if (onUnitSelect) {
      // For other units, navigate to that chunk
      const chunkPath = `/courses/${courseSlug}/${unit.unitNumber}/${index + 1}`;
      onUnitSelect(chunkPath);
    }
    setIsOpen(false);
  };

  const showApplyCTA = applyCTAProps && !applyCTAProps.hasApplied;

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={(
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1 w-full">
          <div className="flex items-center gap-4">
            <CourseIcon courseSlug={courseSlug} />
            <h3 className="text-[20px] leading-[40px] font-semibold text-[#13132E]">
              {courseTitle}
            </h3>
          </div>
          {showApplyCTA && (
            <CTALinkOrButton
              url={applyCTAProps.applicationUrl}
              variant="outline-black"
              target="_blank"
              className="px-3 py-1.5 text-[14px]"
            >
              {`Apply by ${applyCTAProps.applicationDeadline}`}
            </CTALinkOrButton>
          )}
        </div>
      )}
      bottomDrawerOnMobile
    >
      <div className="flex flex-col gap-1 w-full max-w-[600px]">
        {/* Unit Listing */}
        {units.map((unit, unitIndex) => (
          <MobileUnitSection
            key={unit.id}
            unit={unit}
            unitIndex={unitIndex}
            chunks={unitChunks[unit.id] ?? []}
            isExpanded={expandedUnitIds.has(unit.id)}
            isCurrent={isCurrentUnit(unit)}
            currentChunkIndex={currentChunkIndex}
            onToggle={() => toggleUnitExpansion(unit.id)}
            onChunkClick={(index) => handleChunkClick(unit, index)}
            chunkProgress={courseProgressData?.chunkProgressByUnitId[unit.id] ?? []}
          />
        ))}
      </div>
    </Modal>
  );
};

type MobileUnitSectionProps = {
  unit: Unit;
  unitIndex: number;
  chunks: BasicChunk[];
  isExpanded: boolean;
  isCurrent: boolean;
  currentChunkIndex: number;
  onToggle: () => void;
  onChunkClick: (index: number) => void;
  chunkProgress: ChunkProgress[];
};

const MobileUnitSection: React.FC<MobileUnitSectionProps> = ({
  unit,
  unitIndex,
  chunks,
  isExpanded,
  isCurrent,
  currentChunkIndex,
  onToggle,
  onChunkClick,
  chunkProgress,
}) => {
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  return (
    <div className="relative">
      {unitIndex > 0 && (
        <div className="border-t-hairline border-[rgba(42,45,52,0.2)] mx-2 mb-2" />
      )}

      {/* Unit header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center px-2 py-4 gap-2 rounded-lg hover:bg-[rgba(42,45,52,0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-expanded={isExpanded}
        aria-controls={`unit-${unit.id}-chunks`}
      >
        <p className="font-semibold text-size-sm leading-[150%] flex-1 text-left text-[#13132E]">
          {unit.unitNumber}. {unit.title}
        </p>
        <FaChevronRight
          className={clsx(
            'size-3 transition-transform duration-200',
            isExpanded && 'rotate-90',
          )}
        />
      </button>

      {/* Chunk Listing (for any expanded unit) */}
      {isExpanded && (
        <div id={`unit-${unit.id}-chunks`} className="flex flex-col gap-1 pb-4">
          {chunks.map((chunk, index) => {
            const isActive = isCurrent && currentChunkIndex === index;
            return (
              <button
                type="button"
                key={chunk.id}
                onClick={() => onChunkClick(index)}
                className={clsx(
                  'flex items-center px-2 py-4 gap-3 text-left transition-colors rounded-lg',
                  isActive ? 'bg-[rgba(42,45,52,0.05)]' : 'hover:bg-[rgba(42,45,52,0.05)]',
                )}
              >
                <ChunkIcon isActive={isActive} />
                <div className="flex flex-col flex-1 min-h-[44px] justify-center">
                  <div className="flex flex-col gap-[6px]">
                    <p className="font-normal text-[14px] leading-[150%] text-[#13132E]">
                      {chunk.chunkTitle}
                    </p>
                  </div>
                  {chunk.estimatedTime != null && (
                    <div className="flex gap-1 text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#13132E] opacity-60 mt-2">
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
