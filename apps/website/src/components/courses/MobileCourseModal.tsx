import React, { useState } from 'react';
import clsx from 'clsx';
import { FaChevronRight } from 'react-icons/fa6';
import { CTALinkOrButton, Modal } from '@bluedot/ui';
import { unitTable, chunkTable, InferSelectModel } from '@bluedot/db';
import { CourseIcon } from './CourseIcon';
import type { ApplyCTAProps } from './SideBar';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

type MobileCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  courseTitle: string;
  courseSlug: string;
  units: Unit[];
  currentUnitNumber: number;
  chunks: Chunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  onUnitSelect?: (unitPath: string) => void;
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
  chunks,
  currentChunkIndex,
  onChunkSelect,
  onUnitSelect,
  applyCTAProps,
}) => {
  const [isCurrentUnitExpanded, setIsCurrentUnitExpanded] = useState(true);

  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  const isCurrentUnit = (unit: Unit): boolean => {
    return !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  };

  const handleUnitHeaderClick = (unit: Unit) => {
    if (isCurrentUnit(unit)) {
      // Current unit: toggle expansion state to show/hide chunks
      setIsCurrentUnitExpanded((prev) => !prev);
    } else {
      // Different unit: navigate to first chunk and close modal
      if (onUnitSelect) {
        const unitPath = `${unit.coursePath}/${unit.unitNumber}`;
        onUnitSelect(unitPath);
      }
      setIsOpen(false);
    }
  };

  const handleChunkClick = (index: number) => {
    onChunkSelect(index);
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
          const isExpanded = isCurrent && isCurrentUnitExpanded;
          const unitChunks = isCurrent ? chunks : []; // Only show chunks for current unit

          return (
            <div key={unit.id} className="relative">
              {unitIndex > 0 && (
                <div className="border-t-hairline border-[rgba(42,45,52,0.2)] mx-2 mb-2" />
              )}

              {/* Current unit - shows as non-clickable with expand/collapse toggle */}
              {isCurrent ? (
                <div className="w-full flex items-center px-2 py-4 gap-2">
                  <p className="font-semibold text-size-sm leading-[150%] flex-1 text-[#13132E]">
                    {unit.unitNumber}. {unit.title}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCurrentUnitExpanded((prev) => !prev);
                    }}
                    className="p-2 -m-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    aria-label={isExpanded ? 'Collapse unit' : 'Expand unit'}
                    aria-expanded={isExpanded}
                    aria-controls={`unit-${unit.id}-chunks`}
                  >
                    <FaChevronRight
                      className={clsx(
                        'size-3 transition-all duration-200 group-hover:scale-110',
                        isExpanded && 'rotate-90',
                      )}
                    />
                  </button>
                </div>
              ) : (
                // Other units - clickable to navigate to that unit
                <button
                  type="button"
                  onClick={() => handleUnitHeaderClick(unit)}
                  className="w-full flex items-center px-2 py-4 gap-2 text-left hover:bg-[rgba(42,45,52,0.05)] hover:rounded-lg transition-colors"
                >
                  <p className="font-semibold text-size-sm leading-[150%] flex-1 text-[#13132E]">
                    {unit.unitNumber}. {unit.title}
                  </p>
                  <FaChevronRight className="size-3 text-[#13132E]" />
                </button>
              )}

              {/* Chunk Listing (only for current unit when expanded) */}
              {isCurrent && isExpanded && (
                <div id={`unit-${unit.id}-chunks`} className="flex flex-col gap-1 pb-4">
                  {unitChunks.map((chunk, index) => {
                    const isActive = currentChunkIndex === index;
                    return (
                      <button
                        type="button"
                        key={chunk.id}
                        onClick={() => handleChunkClick(index)}
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
