import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import {
  addQueryParam,
  ErrorSection, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { unitResourceTable, InferSelectModel } from '@bluedot/db';
/**
 * Prevents barrel file import errors when importing RESOURCE_FEEDBACK from @bluedot/db
 */
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { GetUnitResourcesResponse } from '../../pages/api/courses/[courseSlug]/[unitNumber]/resources';
import { GetResourceCompletionResponse, PutResourceCompletionRequest } from '../../pages/api/courses/resource-completion/[unitResourceId]';
import {
  A, H4, P,
} from '../Text';
import { ROUTES } from '../../lib/routes';
import Callout from './Callout';
// eslint-disable-next-line import/no-cycle
import Exercise from './exercises/Exercise';
import { GetUnitResponse } from '../../pages/api/courses/[courseSlug]/[unitNumber]';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;

const ResourceListCourseContent: React.FC = () => {
  const { query: { courseSlug, unitNumber } } = useRouter();

  const [{ data: resourcesData, loading: resourcesLoading, error: resourcesError }] = useAxios<GetUnitResourcesResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}/resources`,
  });

  // This will almost always hit useAxios's built-in cache, because we render this on the unit page
  const [{ data: unitData, loading: unitLoading, error: unitError }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}`,
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
      <H4 className="text-[20px] font-semibold leading-[140%] tracking-normal">Resources ({coreResources.reduce((a, b) => a + (b.timeFocusOnMins ?? 0), 0)} mins)</H4>
      <div className="resource-list__core-resources flex flex-col gap-6">
        {coreResources.map((resource) => (
          <ResourceListItem key={resource.id} resource={resource} />
        ))}
      </div>
      {resourcesData.unitExercises.length > 0 && (
        <>
          <H4 className="text-[20px] font-semibold leading-[140%] tracking-normal">Exercises</H4>
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

// Simplified SVG icon components
const ThumbIcon: React.FC<{
  filled: boolean;
  color: string;
  isDislike?: boolean;
  idSuffix?: string;
}> = ({
  filled, color, isDislike = false, idSuffix = '',
}) => {
  const transform = isDislike ? 'scale(1, -1) translate(0, -16)' : undefined;

  if (filled) {
    return (
      <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath={`url(#clip0_${isDislike ? '998_4724' : '999_4733'}${idSuffix})`} transform={transform}>
          <path d="M2.5 6.5H5.5V13H2.5C2.36739 13 2.24021 12.9473 2.14645 12.8536C2.05268 12.7598 2 12.6326 2 12.5V7C2 6.86739 2.05268 6.74021 2.14645 6.64645C2.24021 6.55268 2.36739 6.5 2.5 6.5Z" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5" fill={color} />
          <path d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
          <clipPath id={`clip0_${isDislike ? '998_4724' : '999_4733'}${idSuffix}`}>
            <rect width="16" height="16" fill="white" transform={isDislike ? 'matrix(1 0 0 -1 0.5 16)' : 'translate(0.5)'} />
          </clipPath>
        </defs>
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.66667 14V6.66667M1.33333 8V12.6667C1.33333 13.403 1.93029 14 2.66667 14H12.1871C12.7895 14 13.3088 13.5681 13.4127 12.9738L14.5589 6.30718C14.6947 5.53137 14.1043 4.8 13.3333 4.8H9.33333V2.66667C9.33333 1.56209 8.43791 0.666667 7.33333 0.666667C7.15653 0.666667 7 0.823198 7 1V1.2C7 1.64305 6.86881 2.07613 6.62229 2.44552L4.31105 5.68888C4.11259 5.98575 4 6.3323 4 6.68646V14"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={transform}
      />
    </svg>
  );
};

// Feedback section component used by both desktop and mobile
type FeedbackSectionProps = {
  resourceFeedback: number;
  onFeedback: (type: 'like' | 'dislike') => void;
  variant: 'desktop' | 'mobile';
};

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  resourceFeedback,
  onFeedback,
  variant,
}) => {
  const isLiked = resourceFeedback === RESOURCE_FEEDBACK.LIKE;
  const isDisliked = resourceFeedback === RESOURCE_FEEDBACK.DISLIKE;
  const gapClass = variant === 'mobile' ? 'gap-1' : 'gap-[1px]';

  const renderButton = (type: 'like' | 'dislike') => {
    const isActive = type === 'like' ? isLiked : isDisliked;
    const [isHovered, setIsHovered] = useState(false);

    const activeColor = type === 'like' ? '#2244BB' : '#13132E';
    const activeBackground = type === 'like' ? 'bg-[rgba(34,68,187,0.1)]' : 'bg-[rgba(19,19,46,0.1)]';
    const hoverBackground = 'hover:bg-[rgba(19,19,46,0.05)]';

    const baseClasses = 'flex flex-row justify-center items-center px-2 py-1.5 h-[30px] rounded-md border-none transition-all duration-200 font-medium text-[13px] leading-[140%] tracking-[-0.005em] cursor-pointer';
    const buttonGapClass = variant === 'mobile' ? 'gap-2' : 'gap-1.5';
    const opacityClass = isActive ? 'opacity-100' : 'opacity-60';
    let bgClass = 'bg-transparent';
    if (isActive) {
      bgClass = activeBackground;
    } else if (isHovered) {
      bgClass = 'bg-[rgba(19,19,46,0.05)]';
    }

    let textColorClass = 'text-[#13132E]';
    if (isActive && type === 'like') {
      textColorClass = 'text-[#2244BB]';
    }

    return (
      <button
        type="button"
        onClick={() => onFeedback(type)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${baseClasses} ${buttonGapClass} ${opacityClass} ${bgClass} ${textColorClass} ${!isActive && hoverBackground}`}
      >
        <ThumbIcon
          filled={isActive}
          color={isActive ? activeColor : '#13132E'}
          isDislike={type === 'dislike'}
          idSuffix={variant === 'mobile' ? '_mobile' : ''}
        />
        {type === 'like' ? 'Like' : 'Dislike'}
      </button>
    );
  };

  return (
    <div className={`flex items-center ${gapClass}`}>
      {renderButton('like')}
      {renderButton('dislike')}
    </div>
  );
};

type ResourceListItemProps = {
  resource: UnitResource;
};

const ResourceListItem: React.FC<ResourceListItemProps> = ({ resource }) => {
  const auth = useAuthStore((s) => s.auth);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [resourceFeedback, setResourceFeedback] = useState<number>(RESOURCE_FEEDBACK.NO_RESPONSE);
  const [hasCompletionLoaded, setHasCompletionLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      setIsCompleted(completionData.resourceCompletion.isCompleted || false);
      setResourceFeedback(completionData.resourceCompletion.resourceFeedback || RESOURCE_FEEDBACK.NO_RESPONSE);

      // Always show feedback box if resource is completed
      if (completionData.resourceCompletion.isCompleted) {
        setShowFeedback(true);
      }
    }
  }, [completionData, hasCompletionLoaded]);

  const [, putResourceCompletion] = useAxios<GetResourceCompletionResponse, PutResourceCompletionRequest>({
    method: 'put',
    url: `/api/courses/resource-completion/${resource.id}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  // Handle saving resource completion
  const handleSaveCompletion = useCallback(async (
    updatedIsCompleted: boolean | undefined,
    updatedResourceFeedback?: number,
  ) => {
    if (!auth) return;

    await putResourceCompletion({
      data: {
        isCompleted: updatedIsCompleted ?? isCompleted,
        resourceFeedback: updatedResourceFeedback ?? resourceFeedback,
      },
    });
  }, [auth, isCompleted, resourceFeedback, putResourceCompletion]);

  // Handle marking resource as complete
  const handleToggleComplete = useCallback(async (newIsCompleted = !isCompleted) => {
    setIsCompleted(newIsCompleted);
    setShowFeedback(newIsCompleted);
    await handleSaveCompletion(newIsCompleted);
  }, [isCompleted, handleSaveCompletion]);

  // Handle like/dislike feedback
  const handleFeedback = useCallback(async (type: 'like' | 'dislike') => {
    const feedbackValue = type === 'like' ? RESOURCE_FEEDBACK.LIKE : RESOURCE_FEEDBACK.DISLIKE;
    setResourceFeedback(feedbackValue);
    await handleSaveCompletion(true, feedbackValue);
  }, [handleSaveCompletion]);

  if (completionLoading && !completionData) {
    return <ProgressDots />;
  }

  // We ignore 404s, as this just indicates the resource completion hasn't been created yet
  if (completionError && completionError.status !== 404) {
    return <ErrorView error={completionError} />;
  }

  const wrapperMarginClass = auth && showFeedback ? 'mb-11' : 'mb-0';

  return (
    <div className={`resource-item-wrapper ${wrapperMarginClass}`}>
      <div className="relative">
        {/* Desktop completion circle */}
        {auth && (
          <div className="absolute hidden lg:block -left-[calc(24px+clamp(12px,3vw,24px))] top-6 z-[1]">
            <button
              type="button"
              onClick={() => handleToggleComplete()}
              disabled={!auth}
              aria-label={`Mark as ${isCompleted ? 'incomplete' : 'complete'}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`size-6 rounded-full flex items-center justify-center p-0 transition-all duration-300 box-border ${
                !auth ? 'cursor-not-allowed' : 'cursor-pointer'
              } ${
                (() => {
                  if (isCompleted) {
                    return 'bg-[#2244BB] border-none';
                  }
                  if (isHovered) {
                    return 'bg-[rgba(42,45,52,0.05)] border border-[rgba(42,45,52,0.6)]';
                  }
                  return 'bg-[#FCFBF9] border border-[rgba(19,19,46,0.2)]';
                })()
              }`}
            >
              {(isCompleted || isHovered) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className={`fill-none stroke-linecap-round stroke-linejoin-round ${
                    isCompleted ? 'stroke-white stroke-[1.75]' : 'stroke-[rgba(42,45,52,0.6)] stroke-[1.5]'
                  }`}
                >
                  <path d="M2.5 6L5 8.5L9.5 3.5" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Main resource card */}
        <div className="resource-item px-6 pt-6 pb-6 container-lined bg-white relative z-[1]">
          <div className="resource-item__header flex items-start justify-between">
            <div className="resource-item__content w-full">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {/* Resource title and link */}
                  <P className="resource-item__title font-semibold leading-[140%] tracking-[-0.005em]">
                    {resource.resourceLink ? (
                      <div className="flex items-center gap-2 group">
                        <a
                          href={resource.resourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleToggleComplete(true)}
                          className="no-underline text-inherit group-hover:opacity-80 transition-opacity"
                        >
                          {resource.resourceName}
                        </a>
                        <a
                          href={resource.resourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex group-hover:opacity-80 transition-opacity"
                          aria-label="Open resource in new tab"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.14286 2.28613H13.7143M13.7143 2.28613V6.85756M13.7143 2.28613L8 8.00042" stroke="#13132E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5.71422 3.42871H4.28564C3.18108 3.42871 2.28564 4.32414 2.28564 5.42871V11.7144C2.28564 12.819 3.18108 13.7144 4.28565 13.7144H10.5714C11.6759 13.7144 12.5714 12.819 12.5714 11.7144V10.2859" stroke="#13132E" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      resource.resourceName
                    )}
                  </P>
                </div>
              </div>
            </div>
          </div>

          {/* Resource guide */}
          {resource.resourceGuide && (
            <div className="resource-item__guide mt-4 text-gray-700 text-[15px] font-normal leading-[160%] tracking-[-0.002em]">
              {resource.resourceGuide}
            </div>
          )}

          {/* Author and time metadata */}
          {(resource.authors || resource.timeFocusOnMins) && (
            <div className="resource-item__bottom-metadata mt-4">
              <P className="text-gray-600 text-[13px] font-medium leading-[140%] tracking-[-0.005em]">
                {resource.authors && <span>{resource.authors}</span>}
                {resource.authors && resource.timeFocusOnMins && <span> · </span>}
                {resource.timeFocusOnMins && <span>{resource.timeFocusOnMins} min</span>}
              </P>
            </div>
          )}

          {/* Login prompt for unauthenticated users */}
          {!auth && (
            <P className="resource-item__login-prompt mt-4">
              <A href={addQueryParam(addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname), 'register', 'true')}>
                Create a free account
              </A> to track your progress and unlock access to the full course content.
            </P>
          )}

          {/* Mobile feedback section */}
          {auth && (
            <div className="lg:hidden">
              {/* Separator line */}
              <div className="w-full h-0 opacity-20 border-[0.5px] border-[#13132E] my-4" />

              {/* Bottom action bar */}
              <div className="flex flex-row justify-between items-center p-0 gap-2 h-[30px]">
                {/* Complete/Completed button */}
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(true)}
                    className="flex flex-row justify-center items-center px-2.5 py-1.5 gap-2 w-20 h-[30px] bg-[#2244BB] rounded-md border-none cursor-pointer font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-white flex-shrink-0 transition-all duration-200"
                  >
                    Complete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(false)}
                    className="flex items-center gap-2 transition-all duration-200 hover:opacity-70 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
                    aria-label="Undo completion"
                  >
                    <span className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-[#2244BB]">
                      Completed
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_843_11290)">
                        <path d="M1.5 3.49994V6.49994M1.5 6.49994H4.5M1.5 6.49994L4.11063 4.11056C4.87508 3.34625 5.84782 2.82415 6.90729 2.60951C7.96677 2.39487 9.06601 2.4972 10.0677 2.90372C11.0693 3.31024 11.929 4.00291 12.5392 4.8952C13.1494 5.78749 13.4832 6.83982 13.4988 7.92071C13.5144 9.0016 13.2111 10.0631 12.6268 10.9726C12.0426 11.8821 11.2033 12.5993 10.2137 13.0345C9.22422 13.4698 8.12838 13.6037 7.06316 13.4197C5.99793 13.2357 5.01055 12.7419 4.22438 11.9999" stroke="#2244BB" strokeWidth="1.25" strokeLinecap="square" />
                      </g>
                      <defs>
                        <clipPath id="clip0_843_11290">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                )}

                {/* Feedback buttons (only when completed) */}
                {isCompleted && (
                  <div className="flex-shrink-0">
                    <FeedbackSection
                      resourceFeedback={resourceFeedback}
                      onFeedback={handleFeedback}
                      variant="mobile"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop feedback section */}
        {auth && isCompleted && showFeedback && (
          <div className="hidden lg:block">
            <div
              className="hidden lg:flex items-center transition-all duration-200 px-6 pt-[17px] pb-[9px] gap-2 w-full h-14 bg-[rgba(19,19,46,0.05)] border-[0.5px] border-[rgba(19,19,46,0.15)] rounded-b-[10px] -mt-[10px] relative z-0"
              role="dialog"
              aria-label="Resource feedback"
            >
              <P className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-[#13132E] opacity-60">
                {resourceFeedback === RESOURCE_FEEDBACK.LIKE && 'You liked this resource'}
                {resourceFeedback === RESOURCE_FEEDBACK.DISLIKE && 'You disliked this resource'}
                {resourceFeedback !== RESOURCE_FEEDBACK.LIKE && resourceFeedback !== RESOURCE_FEEDBACK.DISLIKE && 'Was this resource useful?'}
              </P>
              <FeedbackSection
                resourceFeedback={resourceFeedback}
                onFeedback={handleFeedback}
                variant="desktop"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceListCourseContent;
