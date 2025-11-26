import React from 'react';
import { unitResourceTable, exerciseTable, InferSelectModel } from '@bluedot/db';
import { Collapsible, ProgressDots, useAuthStore } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { ResourceListItem } from './ResourceListItem';
import Exercise from './exercises/Exercise';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import { trpc } from '../../utils/trpc';

type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;
type ExerciseType = InferSelectModel<typeof exerciseTable.pg>;

/**
 * Formats resource time in minutes to a human-readable string.
 * Rounds up times to the nearest 5 minutes (for < 60 mins) or 10 minutes (for >= 60 mins).
 * @param totalMins - The total time in minutes
 * @example
 * formatResourceTime(3) => '5 mins'
 * formatResourceTime(7) => '10 mins'
 * formatResourceTime(62) => '1 hr 10 mins'
 * @returns Formatted time string (e.g., "15 mins", "1 hr 30 mins")
 */
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
  const auth = useAuthStore((s) => s.auth);
  const { data: resourceCompletions, isLoading: resourceCompletionsLoading, error: resourceCompletionsError } = trpc.resources.getResourceCompletions.useQuery({ unitResourceIds: resources.map((r) => r.id) }, { enabled: resources.length > 0 && Boolean(auth) });

  if (resourceCompletionsLoading) {
    return <ProgressDots />;
  }

  if (resourceCompletionsError) {
    return <ErrorView error={resourceCompletionsError} />;
  }

  const resourceCompletionMap = new Map(resourceCompletions?.map((rc) => [rc.unitResourceIdRead, rc]));
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
            Resources{totalCoreResourceTime > 0 ? ` (${formatResourceTime(totalCoreResourceTime)})` : ''}
          </h4>
          <ul className="flex flex-col gap-6" aria-labelledby={resourcesHeadingId}>
            {coreResources.map((resource) => (
              <ResourceListItem
                key={resource.id}
                resource={resource}
                resourceCompletion={resourceCompletionMap.get(resource.id)}
                aria-label={unitContext ? `${resource.resourceName} - ${unitContext}` : resource.resourceName}
              />
            ))}
          </ul>
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
          <ul className="resource-display__exercises flex flex-col gap-6" aria-labelledby={exercisesHeadingId}>
            {exercises.map((exercise) => (
              <Exercise
                key={exercise.id}
                exerciseId={exercise.id}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Optional Resources */}
      {optionalResources.length > 0 && (
        <section className="resource-display__optional mt-8">
          <Collapsible title="Optional Resources" summaryClassName="justify-start gap-2">
            <ul className="flex flex-col gap-6" aria-label="Optional resources">
              {optionalResources.map((resource) => (
                <ResourceListItem
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </ul>
          </Collapsible>
        </section>
      )}
    </section>
  );
};
