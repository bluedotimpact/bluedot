import React from 'react';
import clsx from 'clsx';
import { addQueryParam } from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';
import { unitTable, chunkTable, InferSelectModel } from '@bluedot/db';
import { A } from '../Text';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

type SideBarProps = {
  // Required
  courseTitle: string;
  units: Unit[];
  currentUnitNumber: number;
  chunks: Chunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
  // Optional
  className?: string;
};

type SideBarCollapsibleProps = {
  unit: Unit;
  isCurrentUnit: boolean;
  chunks: Chunk[];
  currentChunkIndex: number;
  onChunkSelect: (index: number) => void;
};

// Icon components for different chunk types, currently it's all the same but will be different in the future
const ChunkIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => {
  const iconClass = 'size-6 rounded-full flex items-center justify-center';

  // Always show the same icon for all chunk types
  return (
    <div className={clsx(iconClass, isActive ? 'bg-[#13132E]' : 'bg-[#FCFBF9] border border-[rgba(106,111,122,0.3)]')}>
      {isActive && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="3" width="10" height="1" fill="white" />
          <rect x="2" y="6" width="10" height="1" fill="white" />
          <rect x="2" y="9" width="7" height="1" fill="white" />
        </svg>
      )}
    </div>
  );
};

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
  chunks,
  currentChunkIndex,
  onChunkSelect,
}) => {
  const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);

  return (
    isCurrentUnit ? (
      <div className="relative">
        <div className="absolute top-0 inset-x-[24px] border-t border-[rgba(42,45,52,0.2)]" />
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
                    'flex flex-row items-start p-[16px] gap-[12px] mx-[24px] w-[calc(100%-48px)] min-h-[100px] text-left transition-colors',
                    isActive ? 'bg-[rgba(42,45,52,0.05)] rounded-[10px]' : 'hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px]',
                  )}
                >
                  <ChunkIcon isActive={isActive} />
                  <div className="flex flex-col items-start p-0 gap-[8px] flex-1 min-h-[68px]">
                    <p className="font-semibold text-[14px] leading-[150%] text-[#13132E]">
                      {chunk.chunkTitle}
                    </p>
                    {chunk.estimatedTime && (
                    <span className="text-[13px] leading-[140%] tracking-[-0.005em] font-medium text-[#13132E] opacity-60">
                      {formatTime(chunk.estimatedTime)}
                    </span>
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
        <div className="absolute top-0 inset-x-[24px] border-t border-[rgba(42,45,52,0.2)]" />
        <A href={addQueryParam(unit.path, 'chunk', '0')} className="block mx-[24px] px-[24px] md:px-[12px] py-[15px] no-underline hover:bg-[rgba(42,45,52,0.05)] hover:rounded-[10px] transition-colors">
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
        <div className="flex flex-row items-start gap-[16px]">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="8" fill="#2244BB" />
            <path d="M33.9941 23.4938L30.4941 26.9938C30.3299 27.158 30.1072 27.2502 29.875 27.2502C29.6428 27.2502 29.4201 27.158 29.2559 26.9938C29.0918 26.8296 28.9995 26.6069 28.9995 26.3747C28.9995 26.1425 29.0918 25.9198 29.2559 25.7556L31.263 23.7497H21.487L15.362 29.8747H18.5C18.7321 29.8747 18.9546 29.9669 19.1187 30.131C19.2828 30.2951 19.375 30.5176 19.375 30.7497C19.375 30.9818 19.2828 31.2043 19.1187 31.3684C18.9546 31.5325 18.7321 31.6247 18.5 31.6247H13.25C13.0179 31.6247 12.7954 31.5325 12.6313 31.3684C12.4672 31.2043 12.375 30.9818 12.375 30.7497V25.4997C12.375 25.2676 12.4672 25.0451 12.6313 24.881C12.7954 24.7169 13.0179 24.6247 13.25 24.6247C13.4821 24.6247 13.7046 24.7169 13.8687 24.881C14.0328 25.0451 14.125 25.2676 14.125 25.4997V28.6377L20.25 22.5127V12.7367L18.2441 14.7438C18.0799 14.908 17.8572 15.0002 17.625 15.0002C17.3928 15.0002 17.1701 14.908 17.0059 14.7438C16.8418 14.5796 16.7495 14.3569 16.7495 14.1247C16.7495 13.8925 16.8418 13.6698 17.0059 13.5056L20.5059 10.0056C20.5872 9.92429 20.6837 9.85976 20.7899 9.81572C20.8961 9.77169 21.01 9.74902 21.125 9.74902C21.24 9.74902 21.3538 9.77169 21.4601 9.81572C21.5663 9.85976 21.6628 9.92429 21.7441 10.0056L25.2441 13.5056C25.4082 13.6698 25.5005 13.8925 25.5005 14.1247C25.5005 14.3569 25.4082 14.5796 25.2441 14.7438C25.0799 14.908 24.8572 15.0002 24.625 15.0002C24.3928 15.0002 24.1701 14.908 24.0059 14.7438L22 12.7367V21.9997H31.263L29.2559 19.9938C29.0918 19.8296 28.9995 19.6069 28.9995 19.3747C28.9995 19.1425 29.0918 18.9198 29.2559 18.7556C29.4201 18.5915 29.6428 18.4992 29.875 18.4992C30.1072 18.4992 30.3299 18.5915 30.4941 18.7556L33.9941 22.2556C34.0754 22.3369 34.14 22.4334 34.184 22.5396C34.228 22.6459 34.2507 22.7597 34.2507 22.8747C34.2507 22.9897 34.228 23.1036 34.184 23.2098C34.14 23.316 34.0754 23.4125 33.9941 23.4938Z" fill="white" />
          </svg>
          <div className="flex flex-col justify-center gap-[4px] flex-1">
            <h2 className="font-semibold text-[18px] leading-[120%] text-[#13132E] align-middle">{courseTitle}</h2>
            {/*
            // TODO add this back in once we have a way to track progress
            <p className="text-[12px] leading-[17px] tracking-[-0.005em] font-medium text-[#6A6F7A]">{courseProgress}% completed</p> */}
            <p className="text-[12px] leading-[17px] tracking-[-0.005em] font-medium text-[#6A6F7A]">Interactive Course</p>
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
