import React from 'react';
import { Unit } from '../../lib/api/db/tables';
import { A, P } from '../Text';

type SideBarProps = {
  // Required
  units: Unit[];
  currentUnitNumber: number;
};

const SideBar: React.FC<SideBarProps> = ({
  units,
  currentUnitNumber,
}) => {
  const isCurrentUnit = (unit: Unit) => {
    return currentUnitNumber === Number(unit.unitNumber);
  };
  return (
    <div className="sidebar w-full md:w-[332px] flex flex-col">
      <div className="sidebar__content flex flex-col gap-6">
        {units.map((unit) => (
          <a
            key={unit.id}
            href={unit.path}
            className={`
              sidebar__unit p-4 flex flex-col gap-2
              ${isCurrentUnit(unit) ? 'sidebar__unit--active border-color-primary' : 'border-color-divider'}
              border rounded-lg hover:bg-bluedot-lightest hover:border-color-primary
            `}
          >
            <div className="sidebar__unit-item flex flex-col gap-2">
              <P className="sidebar__unit-number uppercase text-size-xs font-bold">Unit {unit.unitNumber}</P>
              <P className="sidebar__title text-color-secondary-text font-sans text-size-md font-[650]">{unit.title}</P>
              <P className="sidebar__description text-size-s">{unit.description}</P>
            </div>
            {/* {isCurrentUnit(unit) && unit.chapters && (
              <div className="sidebar__chapters flex flex-col gap-4 border-t-2 border-color-primary pt-4">
                {unit.chapters.map((chapter) => (
                  <div className="sidebar__chapter">
                    <P className="sidebar__chapter-detail text-size-xs">
                      <span className="sidebar__chapter-type font-bold text-color-secondary-text">{chapter.type}:</span> <span className="sidebar__chapter-title">{chapter.title}</span>
                    </P>
                  </div>
                ))}
              </div>
            )} */}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
