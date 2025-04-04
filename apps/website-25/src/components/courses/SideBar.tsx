import React from 'react';
import { CourseUnit } from '@bluedot/ui/src/constants';

type SideBarProps = {
  // Required
  units: CourseUnit[];
  currentUnit: CourseUnit;
};

const SideBar: React.FC<SideBarProps> = ({
  units,
  currentUnit,
}) => {
  const isCurrentUnit = (unit: CourseUnit) => {
    return currentUnit.title === unit.title;
  };
  return (
    <div className="sidebar w-full md:w-[332px] flex flex-col">
      <div className="sidebar__content flex flex-col gap-6">
        {units.map((unit) => (
          <div
            className={`sidebar__unit border ${isCurrentUnit(unit) ? 'border-color-primary' : 'border-color-divider'} rounded-radius-md p-4 flex flex-col gap-2`}
          >
            <div className="sidebar__unit-item flex flex-col gap-2">
              <p className="sidebar__title uppercase text-size-xs font-bold">{unit.title}</p>
              <a href={unit.href} className="sidebar__description subtitle-sm">{unit.description}</a>
            </div>
            {isCurrentUnit(unit) && unit.chapters && (
              <div className="sidebar__chapters flex flex-col gap-4 border-t-2 border-color-primary pt-4">
                {unit.chapters.map((chapter) => (
                  <div className="sidebar__chapter">
                    <p className="sidebar__chapter-detail text-size-xs">
                      <span className="sidebar__chapter-type font-bold text-color-secondary-text">{chapter.type}:</span> <span className="sidebar__chapter-title">{chapter.title}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
