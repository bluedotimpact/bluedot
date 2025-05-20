import React from 'react';
import clsx from 'clsx';

import { FaChevronRight } from 'react-icons/fa6';
import { Unit } from '../../lib/api/db/tables';

type SideBarProps = {
  // Required
  units: Unit[];
  currentUnitNumber: number;
};

type SideBarCollapsibleProps = {
  unit: Unit;
  isCurrentUnit: boolean;
};

const SideBarCollapsible: React.FC<SideBarCollapsibleProps> = ({
  unit,
  isCurrentUnit,
}) => {
  return (
    <details
      open={isCurrentUnit}
      className="sidebar-collapsible max-w-max-width border-b border-color-divider last:border-b-0 group marker:hidden [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className={clsx('sidebar-collapsible__header flex justify-between w-full p-4 text-left group-open:border-b border-color-divider', unit.menuText && 'cursor-pointer')}>
        <p className="sidebar-collapsible__title font-bold">{unit.unitNumber}. {unit.title}</p>
        {unit.menuText && (
          <span className="sidebar-collapsible__button flex items-center">
            <FaChevronRight className="size-3 transition-transform group-open:rotate-90" />
          </span>
        )}
      </summary>
      {unit.menuText && (
        <a
          className={clsx('sidebar-collapsible__content block p-4 hover:bg-bluedot-lightest', isCurrentUnit && 'border-l-4 border-color-primary bg-bluedot-lightest')}
          href={unit.path}
        >
          {unit.menuText}
        </a>
      )}
    </details>
  );
};
const SideBar: React.FC<SideBarProps> = ({
  units,
  currentUnitNumber,
}) => {
  const isCurrentUnit = (unit: Unit) => {
    return currentUnitNumber === Number(unit.unitNumber);
  };
  return (
    <div className="sidebar w-full md:w-[320px] flex flex-col">
      <div className="sidebar__header-container flex flex-row gap-2 pb-6">
        <img src="/icons/course.svg" className="size-11" alt="" />
        <div className="sidebar__title-container flex flex-col">
          <p className="sidebar__course-header text-size-sm text-charcoal-light">Course</p>
          <p className="sidebar__course-title bluedot-h4">The Future of AI</p>
        </div>
      </div>
      <div className="sidebar__content flex flex-col container-lined bg-white">
        {units.map((unit) => (
          <SideBarCollapsible
            unit={unit}
            isCurrentUnit={isCurrentUnit(unit)}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
