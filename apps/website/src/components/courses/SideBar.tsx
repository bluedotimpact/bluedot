import React from 'react';
import clsx from 'clsx';
import { addQueryParam } from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';

import { Unit, Chunk } from '../../lib/api/db/tables';
import { A } from '../Text';

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

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
  chunks,
  currentChunkIndex,
  onChunkSelect,
}) => {
  return (
    isCurrentUnit ? (
      <details
        open={isCurrentUnit}
        className="sidebar-collapsible max-w-max-width border-b border-color-divider last:border-b-0 group marker:hidden [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className={clsx('sidebar-collapsible__header flex justify-between w-full p-4 text-left group-open:border-b border-color-divider', unit.menuText && 'cursor-pointer')}>
          <p className="sidebar-collapsible__title font-bold">{unit.unitNumber}. {unit.title}</p>
          <span className="sidebar-collapsible__button flex items-center">
            <FaChevronRight className="size-3 transition-transform group-open:rotate-90" />
          </span>
        </summary>
        {chunks.map((chunk, index) => (
          <button
            type="button"
            key={chunk.id}
            onClick={() => onChunkSelect(index)}
            className={clsx(
              'sidebar-collapsible__content block w-full text-left p-4 hover:bg-bluedot-lightest cursor-pointer',
              currentChunkIndex === index && 'border-l-4 border-color-primary bg-bluedot-lightest',
            )}
          >
            {chunk.chunkTitle}
          </button>
        ))}
      </details>
    ) : (
      <A href={addQueryParam(unit.path, 'chunk', '0')} className="sidebar-collapsible max-w-max-width border-b border-color-divider last:border-b-0 no-underline hover:text-color-secondary-text">
        <div className="sidebar-collapsible__header flex justify-between w-full p-4 text-left border-color-divider">
          <p className="sidebar-collapsible__title font-bold">{unit.unitNumber}. {unit.title}</p>
          <span className="sidebar-collapsible__button flex items-center">
            <FaChevronRight className="size-3" />
          </span>
        </div>
      </A>
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
  const isCurrentUnit = (unit: Unit) => {
    return currentUnitNumber === Number(unit.unitNumber);
  };

  return (
    <div className={clsx('sidebar w-full md:w-[320px] flex flex-col', className)}>
      <div className="sidebar__header-container flex flex-row gap-2 pb-6">
        <img src="/icons/course.svg" className="size-11" alt="" />
        <div className="sidebar__title-container flex flex-col">
          <p className="sidebar__course-header text-size-sm text-[#999eb3]">Course</p>
          <p className="sidebar__course-title bluedot-h4">{courseTitle}</p>
        </div>
      </div>
      <div className="sidebar__content flex flex-col container-lined bg-white">
        {units.map((unit) => (
          <SideBarCollapsible
            key={unit.id}
            unit={unit}
            isCurrentUnit={isCurrentUnit(unit)}
            chunks={chunks}
            currentChunkIndex={currentChunkIndex}
            onChunkSelect={onChunkSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
