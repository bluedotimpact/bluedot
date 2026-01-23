import React, { useState } from 'react';
import clsx from 'clsx';
import { FaChevronRight } from 'react-icons/fa6';
import { CTALinkOrButton, Modal } from '@bluedot/ui';
import { unitTable, InferSelectModel } from '@bluedot/db';
import { CourseIcon } from './CourseIcon';
import type { ApplyCTAProps } from './SideBar';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';

type Unit = InferSelectModel<typeof unitTable.pg>;

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
};

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
}) => {
  // Track which units are expanded (current unit starts expanded)
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(() => {
    const currentUnit = units.find((u) => Number(u.unitNumber) === currentUnitNumber);
    return currentUnit ? new Set([currentUnit.id]) : new Set();
  });

  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

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
        {units.map((unit, unitIndex) => {
          const isCurrent = isCurrentUnit(unit);
          const isExpanded = expandedUnitIds.has(unit.id);
          const unitChunkList = unitChunks[unit.id] ?? [];

          return (
            <div key={unit.id} className="relative">
              {unitIndex > 0 && (
                <div className="border-t-hairline border-[rgba(42,45,52,0.2)] mx-2 mb-2" />
              )}

              {/* Unit header - clickable to expand/collapse */}
              <button
                type="button"
                onClick={() => toggleUnitExpansion(unit.id)}
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
                  {unitChunkList.map((chunk, index) => {
                    const isActive = isCurrent && currentChunkIndex === index;
                    return (
                      <button
                        type="button"
                        key={chunk.id}
                        onClick={() => handleChunkClick(unit, index)}
                        className={clsx(
                          'flex items-center px-2 py-4 gap-3 text-left transition-colors rounded-lg',
                          isActive ? 'bg-[rgba(42,45,52,0.05)]' : 'hover:bg-[rgba(42,45,52,0.05)]',
                        )}
                      >
                        <ChunkIcon isActive={isActive} />
                        <div className="flex flex-col flex-1 min-h-[44px] justify-center">
                          {/* Chunk content wrapper with proper spacing */}
                          <div className="flex flex-col gap-[6px]">
                            {/* Chunk Title */}
                            <p className="font-normal text-[14px] leading-[150%] text-[#13132E]">
                              {chunk.chunkTitle}
                            </p>
                          </div>
                          {chunk.estimatedTime != null && (
                            <span className="text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#13132E] opacity-60 mt-2">
                              {formatTime(chunk.estimatedTime)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
