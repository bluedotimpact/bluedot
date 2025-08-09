import React, { useState } from 'react';
import {
  animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useTransform,
} from 'framer-motion';
import {
  Modal, ModalOverlay, Dialog,
} from 'react-aria-components';
import clsx from 'clsx';
import { FaChevronRight } from 'react-icons/fa6';
import { addQueryParam } from '@bluedot/ui';
import { unitTable, chunkTable, InferSelectModel } from '@bluedot/db';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

const MotionModal = motion(Modal);
const MotionModalOverlay = motion(ModalOverlay);

const inertiaTransition = {
  type: 'inertia' as const,
  bounceStiffness: 300,
  bounceDamping: 40,
  timeConstant: 300,
};

const staticTransition = {
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

const SHEET_MARGIN = 34;
// Height calculation: mobile header (p-3 = 12px) + content (icon 32px + text ~32px) + p-3 = ~76px
// Plus navigation bar height (top-16 = 64px) = 140px total offset
const HEADER_OFFSET = 140; // Offset to position modal below sticky header

type MobileCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  units: Unit[];
  currentUnitNumber: number;
  chunks: Chunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  onUnitSelect?: (unitPath: string) => void;
};

export const MobileCourseModal: React.FC<MobileCourseModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  units,
  currentUnitNumber,
  chunks,
  currentChunkIndex,
  onChunkSelect,
  onUnitSelect,
}) => {
  // State for tracking if current unit is expanded (simpler than Set)
  const [isCurrentUnitExpanded, setIsCurrentUnitExpanded] = useState(true);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const h = windowHeight - SHEET_MARGIN - HEADER_OFFSET;
  const y = useMotionValue(h);
  const bgOpacity = useTransform(y, [0, h], [0.4, 0]);
  const bg = useMotionTemplate`rgba(0, 0, 0, ${bgOpacity})`;

  // Helper functions
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  const isCurrentUnit = (unit: Unit): boolean => {
    return !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  };

  // Course icon component (extracted for readability)
  // eslint-disable-next-line react/no-unstable-nested-components
  const CourseIcon = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#2244BB" />
      <path d="M31.9941 21.4938L28.4941 24.9938C28.3299 25.158 28.1072 25.2502 27.875 25.2502C27.6428 25.2502 27.4201 25.158 27.2559 24.9938C27.0918 24.8296 26.9995 24.6069 26.9995 24.3747C26.9995 24.1425 27.0918 23.9198 27.2559 23.7556L29.263 21.7497H19.487L13.362 27.8747H16.5C16.7321 27.8747 16.9546 27.9669 17.1187 28.131C17.2828 28.2951 17.375 28.5176 17.375 28.7497C17.375 28.9818 17.2828 29.2043 17.1187 29.3684C16.9546 29.5325 16.7321 29.6247 16.5 29.6247H11.25C11.0179 29.6247 10.7954 29.5325 10.6313 29.3684C10.4672 29.2043 10.375 28.9818 10.375 28.7497V23.4997C10.375 23.2676 10.4672 23.0451 10.6313 22.881C10.7954 22.7169 11.0179 22.6247 11.25 22.6247C11.4821 22.6247 11.7046 22.7169 11.8687 22.881C12.0328 23.0451 12.125 23.2676 12.125 23.4997V26.6377L18.25 20.5127V10.7367L16.2441 12.7438C16.0799 12.908 15.8572 13.0002 15.625 13.0002C15.3928 13.0002 15.1701 12.908 15.0059 12.7438C14.8418 12.5796 14.7495 12.3569 14.7495 12.1247C14.7495 11.8925 14.8418 11.6698 15.0059 11.5056L18.5059 8.00564C18.5872 7.92429 18.6837 7.85976 18.7899 7.81572C18.8961 7.77169 19.01 7.74902 19.125 7.74902C19.24 7.74902 19.3538 7.77169 19.4601 7.81572C19.5663 7.85976 19.6628 7.92429 19.7441 8.00564L23.2441 11.5056C23.4082 11.6698 23.5005 11.8925 23.5005 12.1247C23.5005 12.3569 23.4082 12.5796 23.2441 12.7438C23.0799 12.908 22.8572 13.0002 22.625 13.0002C22.3928 13.0002 22.1701 12.908 22.0059 12.7438L20 10.7367V19.9997H29.263L27.2559 17.9938C27.0918 17.8296 26.9995 17.6069 26.9995 17.3747C26.9995 17.1425 27.0918 16.9198 27.2559 16.7556C27.4201 16.5915 27.6428 16.4992 27.875 16.4992C28.1072 16.4992 28.3299 16.5915 28.4941 16.7556L31.9941 20.2556C32.0754 20.3369 32.14 20.4334 32.184 20.5396C32.228 20.6459 32.2507 20.7597 32.2507 20.8747C32.2507 20.9897 32.228 21.1036 32.184 21.2098C32.14 21.316 32.0754 21.4125 31.9941 21.4938Z" fill="white" />
    </svg>
  );

  const toggleCurrentUnit = () => {
    setIsCurrentUnitExpanded((prev) => !prev);
  };

  const handleUnitHeaderClick = (unit: Unit) => {
    if (isCurrentUnit(unit)) {
      // If it's the current unit, just toggle expand/collapse
      toggleCurrentUnit();
    } else {
      // If it's a different unit, navigate to it and close modal
      if (onUnitSelect) {
        onUnitSelect(addQueryParam(unit.path, 'chunk', '0'));
      }
      onClose();
    }
  };

  const handleChunkClick = (index: number) => {
    onChunkSelect(index);
    onClose();
  };

  // Chunk Icon component (from SideBar)
  // eslint-disable-next-line react/no-unstable-nested-components
  const ChunkIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <div className={clsx(
      'size-6 rounded-full flex items-center justify-center',
      isActive ? 'bg-[#13132E]' : 'bg-[#FCFBF9] border border-[rgba(106,111,122,0.3)]',
    )}
    >
      {isActive && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="3" width="10" height="1" fill="white" />
          <rect x="2" y="6" width="10" height="1" fill="white" />
          <rect x="2" y="9" width="7" height="1" fill="white" />
        </svg>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionModalOverlay
          isOpen
          onOpenChange={onClose}
          className="fixed inset-0 z-10"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ backgroundColor: bg as any }}
        >
          <MotionModal
            className="bg-color-canvas absolute bottom-0 w-full rounded-t-[24px] shadow-lg will-change-transform flex flex-col"
            initial={{ y: h }}
            animate={{ y: 0 }}
            exit={{ y: h }}
            transition={staticTransition}
            style={{
              y,
              top: SHEET_MARGIN + HEADER_OFFSET,
              height: h,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > windowHeight * 0.75 || velocity.y > 10) {
                onClose();
              } else {
                animate(y, 0, { ...inertiaTransition, min: 0, max: 0 });
              }
            }}
          >
            <Dialog className="outline-hidden h-full flex flex-col rounded-t-[24px] overflow-hidden">
              {/* Top Header Section - matches mobile header height (76px) */}
              <div className="flex flex-col items-center bg-[#FCFAF7] border-b-[0.5px] border-[rgba(19,19,46,0.2)] h-[76px] rounded-t-[24px]">
                {/* Drag handle styled per specs */}
                <div className="w-[30px] h-1 bg-[rgba(19,19,46,0.3)] rounded-[3px] mt-2" />

                {/* Header with icon and course title - flex-1 to fill remaining space */}
                <div className="flex items-center px-5 gap-4 w-full flex-1">
                  <CourseIcon />
                  <div className="flex flex-col justify-center gap-0.5 flex-1">
                    <h2 className="text-size-md leading-[110%] font-semibold text-[#13132E]">{courseTitle}</h2>
                    <p className="text-size-xs leading-[140%] tracking-[-0.005em] font-medium text-[#6A6F7A]">Interactive Course</p>
                  </div>
                </div>
              </div>

              {/* Content - Show all units with expand/collapse */}
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto px-4 pb-safe">
                {units.map((unit, unitIndex) => {
                  const isCurrent = isCurrentUnit(unit);
                  const isExpanded = isCurrent && isCurrentUnitExpanded;
                  const unitChunks = isCurrent ? chunks : [];

                  return (
                    <div key={unit.id} className="relative">
                      {/* Unit Border */}
                      {unitIndex > 0 && (
                        <div className="border-t border-[rgba(42,45,52,0.2)] mx-6" />
                      )}

                      {/* Unit Header */}
                      {isCurrent ? (
                        /* Current unit - split into text area and chevron toggle button */
                        <div className="w-full flex items-center px-6 py-4 gap-2">
                          <p className="font-semibold text-size-sm leading-tight flex-1 text-[#13132E]">
                            {unit.unitNumber}. {unit.title}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCurrentUnit();
                            }}
                            className="p-2 -m-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            aria-label={isExpanded ? 'Collapse unit' : 'Expand unit'}
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
                        /* Other units - keep existing single button behavior */
                        <button
                          type="button"
                          onClick={() => handleUnitHeaderClick(unit)}
                          className="w-full flex items-center px-6 py-4 gap-2 text-left hover:bg-[rgba(42,45,52,0.05)] hover:rounded-lg transition-colors"
                        >
                          <p className="font-semibold text-size-sm leading-tight flex-1 text-[#13132E]">
                            {unit.unitNumber}. {unit.title}
                          </p>
                          <FaChevronRight className="size-3 text-[#13132E]" />
                        </button>
                      )}

                      {/* Chunks (only show if current unit and expanded) */}
                      {isCurrent && isExpanded && (
                        <div className="flex flex-col gap-1 pb-4">
                          {unitChunks.map((chunk, index) => {
                            const isActive = currentChunkIndex === index;
                            return (
                              <button
                                type="button"
                                key={chunk.id}
                                onClick={() => handleChunkClick(index)}
                                className={clsx(
                                  'flex items-start px-6 py-4 gap-3 text-left transition-colors rounded-lg',
                                  isActive ? 'bg-[rgba(42,45,52,0.05)]' : 'hover:bg-[rgba(42,45,52,0.05)]',
                                )}
                              >
                                <ChunkIcon isActive={isActive} />
                                <div className="flex flex-col gap-2 flex-1 min-h-[44px]">
                                  <p className="font-semibold text-size-sm leading-normal text-[#13132E]">
                                    {chunk.chunkTitle}
                                  </p>
                                  {chunk.estimatedTime && (
                                    <span className="text-size-xs leading-tight tracking-tight font-medium text-[#13132E] opacity-60">
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
            </Dialog>
          </MotionModal>
        </MotionModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default MobileCourseModal;
