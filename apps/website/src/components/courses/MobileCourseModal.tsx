import React, { useState } from 'react';
import clsx from 'clsx';
import { FaChevronRight } from 'react-icons/fa6';
import { Modal } from '@bluedot/ui';
import { unitTable, chunkTable, InferSelectModel } from '@bluedot/db';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

type MobileCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  courseTitle: string;
  units: Unit[];
  currentUnitNumber: number;
  chunks: Chunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  onUnitSelect?: (unitPath: string) => void;
};

const CourseIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect className="fill-bluedot-normal" width="40" height="40" rx="8" />
    <path d="M31.9941 21.4938L28.4941 24.9938C28.3299 25.158 28.1072 25.2502 27.875 25.2502C27.6428 25.2502 27.4201 25.158 27.2559 24.9938C27.0918 24.8296 26.9995 24.6069 26.9995 24.3747C26.9995 24.1425 27.0918 23.9198 27.2559 23.7556L29.263 21.7497H19.487L13.362 27.8747H16.5C16.7321 27.8747 16.9546 27.9669 17.1187 28.131C17.2828 28.2951 17.375 28.5176 17.375 28.7497C17.375 28.9818 17.2828 29.2043 17.1187 29.3684C16.9546 29.5325 16.7321 29.6247 16.5 29.6247H11.25C11.0179 29.6247 10.7954 29.5325 10.6313 29.3684C10.4672 29.2043 10.375 28.9818 10.375 28.7497V23.4997C10.375 23.2676 10.4672 23.0451 10.6313 22.881C10.7954 22.7169 11.0179 22.6247 11.25 22.6247C11.4821 22.6247 11.7046 22.7169 11.8687 22.881C12.0328 23.0451 12.125 23.2676 12.125 23.4997V26.6377L18.25 20.5127V10.7367L16.2441 12.7438C16.0799 12.908 15.8572 13.0002 15.625 13.0002C15.3928 13.0002 15.1701 12.908 15.0059 12.7438C14.8418 12.5796 14.7495 12.3569 14.7495 12.1247C14.7495 11.8925 14.8418 11.6698 15.0059 11.5056L18.5059 8.00564C18.5872 7.92429 18.6837 7.85976 18.7899 7.81572C18.8961 7.77169 19.01 7.74902 19.125 7.74902C19.24 7.74902 19.3538 7.77169 19.4601 7.81572C19.5663 7.85976 19.6628 7.92429 19.7441 8.00564L23.2441 11.5056C23.4082 11.6698 23.5005 11.8925 23.5005 12.1247C23.5005 12.3569 23.4082 12.5796 23.2441 12.7438C23.0799 12.908 22.8572 13.0002 22.625 13.0002C22.3928 13.0002 22.1701 12.908 22.0059 12.7438L20 10.7367V19.9997H29.263L27.2559 17.9938C27.0918 17.8296 26.9995 17.6069 26.9995 17.3747C26.9995 17.1425 27.0918 16.9198 27.2559 16.7556C27.4201 16.5915 27.6428 16.4992 27.875 16.4992C28.1072 16.4992 28.3299 16.5915 28.4941 16.7556L31.9941 20.2556C32.0754 20.3369 32.14 20.4334 32.184 20.5396C32.228 20.6459 32.2507 20.7597 32.2507 20.8747C32.2507 20.9897 32.228 21.1036 32.184 21.2098C32.14 21.316 32.0754 21.4125 31.9941 21.4938Z" fill="white" />
  </svg>
);

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
  units,
  currentUnitNumber,
  chunks,
  currentChunkIndex,
  onChunkSelect,
  onUnitSelect,
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

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={(
        <div className="flex items-center gap-4 pb-1">
          <CourseIcon />
          <div className="flex flex-col justify-center gap-0.5 flex-1">
            <h3 className="text-size-md leading-[110%] font-semibold text-[#13132E]">
              {courseTitle}
            </h3>
            <p className="text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#6A6F7A]">Interactive Course</p>
          </div>
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
