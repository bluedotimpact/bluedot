import { Section, SlideList, UnitCard } from '@bluedot/ui';
import { Unit } from '../../lib/api/db/tables';

export const CourseUnitsSection = ({ units }: { units: Unit[] }) => {
  return (
    <Section className="course-units-section" title="What you'll learn" titleLevel="h3">
      <div className="course-units-section__content">
        {/* Units must be sorted to ensure correct order */}
        <SlideList
          maxItemsPerSlide={4}
          minItemWidth={300}
          className="course-units-section__units"
        >
          {units.sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber)).map((unit) => (
            <div key={unit.unitNumber} className="max-w-[350px] h-full">
              <UnitCard
                key={unit.unitNumber}
                className="course-units-section__unit h-full"
                description={unit.menuText}
                duration={unit.duration}
                title={unit.title}
                unitNumber={unit.unitNumber}
                url={unit.path}
              />
            </div>
          ))}
        </SlideList>
      </div>
    </Section>
  );
};
