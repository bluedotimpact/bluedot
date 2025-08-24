import React from 'react';
import { unitResourceTable, exerciseTable, InferSelectModel } from '@bluedot/db';
// eslint-disable-next-line import/no-cycle
import { ResourceListItem } from './ResourceListCourseContent';
import Exercise from './exercises/Exercise';
import Callout from './Callout';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;
type ExerciseType = InferSelectModel<typeof exerciseTable.pg>;

// Utility functions extracted from duplicated code
export const formatResourceTime = (totalMins: number): string => {
  const roundedMins = totalMins < 60
    ? Math.ceil(totalMins / 5) * 5
    : Math.ceil(totalMins / 10) * 10;

  if (roundedMins < 60) {
    return `${roundedMins} mins`;
  }

  const hours = Math.floor(roundedMins / 60);
  const remainingMins = roundedMins % 60;
  const hrLabel = hours === 1 ? 'hr' : 'hrs';

  return remainingMins === 0
    ? `${hours} ${hrLabel}`
    : `${hours} ${hrLabel} ${remainingMins} mins`;
};

export const calculateResourceTime = (resources: UnitResource[]): number => {
  return resources.reduce((total, resource) => total + (resource.timeFocusOnMins ?? 0), 0);
};

export const filterResourcesByType = <T extends { coreFurtherMaybe?: string | null }>(
  resources: T[],
  type: 'Core' | 'Further',
): T[] => {
  return resources.filter((resource) => resource.coreFurtherMaybe === type);
};

type ResourceDisplayProps = {
  resources: UnitResource[];
  exercises?: ExerciseType[];
  unitDescription?: string;
  className?: string;
  unitTitle?: string;
  unitNumber?: number;
};

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resources,
  exercises = [],
  unitDescription,
  className = '',
  unitTitle,
  unitNumber,
}) => {
  const coreResources = filterResourcesByType(resources, 'Core');
  const optionalResources = filterResourcesByType(resources, 'Further');
  const totalCoreResourceTime = calculateResourceTime(coreResources);

  // Generate unique IDs for ARIA labeling
  const unitContext = unitTitle && unitNumber ? `Unit ${unitNumber}: ${unitTitle}` : '';
  const resourcesHeadingId = `resources-heading-${unitNumber || 'default'}`;
  const exercisesHeadingId = `exercises-heading-${unitNumber || 'default'}`;

  return (
    <section className={`resource-display ${className}`} aria-label={unitContext || 'Course resources and exercises'}>
      {/* Unit description (for unit resource page) */}
      {unitDescription && (
        <section className="resource-display__description">
          <MarkdownExtendedRenderer>{unitDescription}</MarkdownExtendedRenderer>
        </section>
      )}

      {/* Core Resources */}
      {coreResources.length > 0 && (
        <section className={`resource-display__core ${unitDescription ? 'mt-8' : ''}`}>
          <h4
            id={resourcesHeadingId}
            className="text-[20px] font-semibold leading-[140%] tracking-normal mb-6 bluedot-h4 not-prose"
          >
            Resources ({formatResourceTime(totalCoreResourceTime)})
          </h4>
          <div className="flex flex-col gap-6" role="list" aria-labelledby={resourcesHeadingId}>
            {coreResources.map((resource) => (
              <ResourceListItem
                key={resource.id}
                resource={resource}
                aria-label={unitContext ? `${resource.resourceName} - ${unitContext}` : resource.resourceName}
              />
            ))}
          </div>
        </section>
      )}

      {/* Exercises */}
      {exercises.length > 0 && (
        <section className={`${coreResources.length > 0 || unitDescription ? 'mt-8' : ''}`}>
          <h4
            id={exercisesHeadingId}
            className="text-[20px] font-semibold leading-[140%] tracking-normal mb-6 bluedot-h4 not-prose"
          >
            Exercises
          </h4>
          <div className="resource-display__exercises flex flex-col gap-6" role="list" aria-labelledby={exercisesHeadingId}>
            {exercises.map((exercise) => (
              <Exercise
                key={exercise.id}
                exerciseId={exercise.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Optional Resources */}
      {optionalResources.length > 0 && (
        <section className="resource-display__optional mt-8">
          <Callout title="Optional resources">
            <div className="flex flex-col gap-6" role="list" aria-label="Optional resources">
              {optionalResources.map((resource) => (
                <ResourceListItem
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </div>
          </Callout>
        </section>
      )}
    </section>
  );
};
