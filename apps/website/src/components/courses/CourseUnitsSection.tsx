import { Section, SlideList, UnitCard } from '@bluedot/ui';
import { unitTable, InferSelectModel } from '@bluedot/db';

type Unit = InferSelectModel<typeof unitTable.pg>;

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
          {units.sort((a, b) => Number(a.unitNumber || Infinity) - Number(b.unitNumber || Infinity)).map((unit) => (
            <div key={unit.unitNumber || unit.id} className="max-w-[350px] h-full">
              <UnitCard
                key={unit.unitNumber || unit.id}
                className="course-units-section__unit h-full"
                description={unit.menuText || undefined}
                duration={unit.duration || undefined}
                title={unit.title || ''}
                unitNumber={unit.unitNumber || ''}
                url={unit.path || ''}
              />
            </div>
          ))}
        </SlideList>
      </div>
    </Section>
  );
};
