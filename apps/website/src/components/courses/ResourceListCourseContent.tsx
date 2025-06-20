import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import {
  addQueryParam,
  ClickTarget, CTALinkOrButton, ErrorSection, ProgressDots, Textarea, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { FaRegSquare, FaSquareCheck } from 'react-icons/fa6';
import { unitResourceTable, InferSelectModel } from '@bluedot/db';
import { GetUnitResourcesResponse } from '../../pages/api/courses/[courseSlug]/[unitId]/resources';
import { GetResourceCompletionResponse, PutResourceCompletionRequest } from '../../pages/api/courses/resource-completion/[unitResourceId]';
import StarRating from './StarRating';
import {
  A, H2, H3, H4, P,
} from '../Text';
import { ROUTES } from '../../lib/routes';
import Callout from './Callout';
// eslint-disable-next-line import/no-cycle
import Exercise from './exercises/Exercise';
import { GetUnitResponse } from '../../pages/api/courses/[courseSlug]/[unitId]';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;

const ResourceListCourseContent: React.FC = () => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data: resourcesData, loading: resourcesLoading, error: resourcesError }] = useAxios<GetUnitResourcesResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}/resources`,
  });

  // This will almost always hit useAxios's built-in cache, because we render this on the unit page
  const [{ data: unitData, loading: unitLoading, error: unitError }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}`,
  });

  if (resourcesLoading || unitLoading) {
    return <ProgressDots />;
  }

  if (resourcesError || !resourcesData || unitError || !unitData) {
    return <ErrorSection error={resourcesError ?? new Error('Missing data from API')} />;
  }

  const coreResources = resourcesData.unitResources.filter((r) => r.coreFurtherMaybe === 'Core');
  const optionalResources = resourcesData.unitResources.filter((r) => r.coreFurtherMaybe === 'Further');

  return (
    <div className="resource-list flex flex-col gap-6">
      {unitData.unit.description && <div className="resource-list__description"><MarkdownExtendedRenderer>{unitData.unit.description}</MarkdownExtendedRenderer></div>}
      {unitData.unit.learningOutcomes && (
      <div className="resource-list__learning-outcomes">
        <H4>By the end of the unit, you should be able to:</H4>
        <MarkdownExtendedRenderer>{unitData.unit.learningOutcomes}</MarkdownExtendedRenderer>
      </div>
      )}
      <H2>Resources ({coreResources.reduce((a, b) => a + (b.timeFocusOnMins ?? 0), 0)} mins)</H2>
      <div className="resource-list__core-resources flex flex-col gap-6">
        {coreResources.map((resource) => (
          <ResourceListItem key={resource.id} resource={resource} />
        ))}
      </div>
      {resourcesData.unitExercises.length > 0 && (
        <>
          <H2>Exercises</H2>
          <div className="resource-list__exercises !-my-6">
            {resourcesData.unitExercises.map((exercise) => (
              <Exercise key={exercise.id} exerciseId={exercise.id} />
            ))}
          </div>
        </>
      )}
      {optionalResources.length > 0 && (
      <Callout title="Optional resources">
        <div className="resource-list__optional-resources flex flex-col gap-6">
          {optionalResources.map((resource) => (
            <ResourceListItem key={resource.id} resource={resource} />
          ))}
        </div>
      </Callout>
      )}
    </div>
  );
};

type ResourceListItemProps = {
  resource: UnitResource;
};

const ResourceListItem: React.FC<ResourceListItemProps> = ({ resource }) => {
  const auth = useAuthStore((s) => s.auth);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [hasCompletionLoaded, setHasCompletionLoaded] = useState(false);

  // Fetch resource completion data
  const [{
    data: completionData,
    loading: completionLoading,
    error: completionError,
  }, fetchResourceCompletion] = useAxios<GetResourceCompletionResponse>({
    method: 'get',
    url: `/api/courses/resource-completion/${resource.id}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  // Fetch resource completion when auth is available
  useEffect(() => {
    if (auth) {
      fetchResourceCompletion().catch(() => { /* no op, as we handle errors above */ });
    }
  }, [auth, fetchResourceCompletion]);

  // Update local state when completion data is fetched the first time
  useEffect(() => {
    if (completionData?.resourceCompletion && !hasCompletionLoaded) {
      setHasCompletionLoaded(true);
      setRating(completionData.resourceCompletion.rating);
      setFeedback(completionData.resourceCompletion.feedback || '');
      setIsCompleted(completionData.resourceCompletion.isCompleted || false);
    }
  }, [completionData]);

  const [{
    data: completionPutData,
    loading: completionPutLoading,
    error: completionPutError,
  }, putResourceCompletion] = useAxios<GetResourceCompletionResponse, PutResourceCompletionRequest>({
    method: 'put',
    url: `/api/courses/resource-completion/${resource.id}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  // Handle saving resource completion
  const handleSaveCompletion = useCallback(async (
    updatedRating: number | undefined,
    updatedFeedback: string | undefined,
    updatedIsCompleted: boolean | undefined,
  ) => {
    if (!auth) return;

    await putResourceCompletion({
      data: {
        rating: updatedRating ?? rating,
        feedback: updatedFeedback ?? feedback,
        isCompleted: updatedIsCompleted ?? isCompleted,
      },
    });

    await fetchResourceCompletion().catch(() => { /* no op, as we handle errors above */ });
  }, [auth, resource.id, rating, feedback, isCompleted, fetchResourceCompletion]);

  // Handle marking resource as complete
  const handleToggleComplete = useCallback(async (newIsCompleted = !isCompleted) => {
    setIsCompleted(newIsCompleted);
    await handleSaveCompletion(undefined, undefined, newIsCompleted);
  }, [isCompleted, handleSaveCompletion]);

  // Handle rating change
  const handleRatingChange = useCallback(async (newRating: number) => {
    setRating(newRating);
    setIsCompleted(true);
    await handleSaveCompletion(newRating, undefined, true);
  }, [handleSaveCompletion, rating]);

  // Handle feedback change
  const handleFeedbackSubmit = useCallback(async () => {
    await handleSaveCompletion(undefined, feedback, undefined);
  }, [feedback, handleSaveCompletion]);

  if (completionLoading && !completionData) {
    return <ProgressDots />;
  }

  // We ignore 404s, as this just indicates the resource completion hasn't been created yet
  if (completionError && completionError.status !== 404) {
    return <ErrorView error={completionError} />;
  }

  return (
    <div className="resource-item p-8 container-lined bg-white">
      <div className="resource-item__header flex items-start justify-between">
        <div className="flex items-center">
          <div className="resource-item__checkbox mr-4">
            <ClickTarget
              onClick={() => handleToggleComplete()}
              disabled={!auth}
              aria-label={`Mark as ${isCompleted ? 'incomplete' : 'complete'}`}
            >
              {isCompleted ? (
                <FaSquareCheck className="text-green-500 size-8" />
              ) : (
                <FaRegSquare className="size-8" />
              )}
            </ClickTarget>
          </div>
          <div className="resource-item__content">
            <H3 className="resource-item__title">
              {resource.resourceLink
                ? <A href={resource.resourceLink} target="_blank" onClick={() => handleToggleComplete(true)}>{resource.resourceName}</A>
                : resource.resourceName}
            </H3>
            <P className="resource-item__metadata flex items-center mt-2 text-gray-600">
              <span className="hidden sm:inline resource-item__type px-2 py-1 bg-blue-100 text-blue-800 rounded-full mr-2">
                {resource.resourceType || 'Resource'}
              </span>
              {resource.authors && <span className="resource-item__author">by {resource.authors}{resource.timeFocusOnMins && ` (${resource.timeFocusOnMins} mins)`}</span>}
            </P>
          </div>
        </div>
      </div>

      {resource.resourceGuide && (
        <div className="resource-item__guide mt-4 text-gray-700">
          {resource.resourceGuide}
        </div>
      )}

      {auth ? (
        <div className="resource-item__feedback">
          <P className="resource-item__rating-prompt mt-4 mb-2">How useful was this resource?</P>
          <div className="resource-item__rating">
            <StarRating
              rating={rating ?? 0}
              onChange={(r) => {
                handleRatingChange(r);
                setShowFeedback(true);
              }}
            />
          </div>
          {showFeedback ? (
            <div className="resource-item__feedback-form">
              <P className="mt-4 mb-2">Do you have any other feedback on this resource?</P>
              <Textarea
                className="resource-item__feedback-input w-full"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback here..."
              />
              {completionPutError && <ErrorView error={completionPutError} />}
              <div className="resource-item__actions flex justify-between gap-2 mt-2">
                <div className="resource-item__submit flex items-center gap-2">
                  <CTALinkOrButton
                    onClick={handleFeedbackSubmit}
                    disabled={completionPutLoading}
                    className="resource-item__submit-button"
                  >
                    {completionPutLoading ? 'Saving...' : 'Save'}
                  </CTALinkOrButton>
                  {completionPutData && completionPutData.resourceCompletion?.rating === rating && completionPutData.resourceCompletion?.feedback === feedback && <P className="resource-item__success-message text-green-800 bg-green-200 py-2 px-3 rounded-full">Feedback saved</P>}
                </div>
                <A onClick={() => setShowFeedback(false)} className="resource-item__hide-button">
                  Hide feedback
                </A>
              </div>
            </div>
          ) : (
            rating !== null && (
              <P className="resource-item__show-feedback mt-4"><A onClick={() => setShowFeedback(true)}>Tell us why you gave this rating...</A></P>
            )
          )}
        </div>
      ) : (
        <P className="resource-item__login-prompt mt-4"><A href={addQueryParam(addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname), 'register', 'true')}>Create a free account</A> to track your progress and unlock access to the full course content.</P>
      )}
    </div>
  );
};

export default ResourceListCourseContent;
