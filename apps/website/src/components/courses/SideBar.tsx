import React from 'react';
import { Unit } from '../../lib/api/db/tables';
import { P } from '../Text';
import { UnitCard } from '@bluedot/ui';

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
          <UnitCard
            key={unit.unitNumber}
            description={unit.description}
            title={unit.title}
            unitNumber={unit.unitNumber}
            url={unit.path}
            isCurrentUnit={isCurrentUnit(unit)}
          />
        ))}
      </div>
    </div>
  );
};

export default SideBar;
