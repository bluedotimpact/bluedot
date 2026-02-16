import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useRouter } from 'next/router';
import {
  A,
  addQueryParam,
  P,
  useAuthStore,
} from '@bluedot/ui';
/**
 * Prevents barrel file import errors when importing RESOURCE_FEEDBACK from @bluedot/db
 */
import {
  RESOURCE_FEEDBACK, type ResourceFeedbackValue, type ResourceCompletion, type UnitResource,
} from '@bluedot/db/src/schema';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import { FaviconImage } from './FaviconImage';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import ListenToArticleButton from './ListenToArticleButton';
import RichTextAutoSaveEditor from './exercises/RichTextAutoSaveEditor';
import { trpc } from '../../utils/trpc';
import { ThumbIcon } from '../icons/ThumbIcon';
import { CheckmarkIcon } from '../icons/CheckmarkIcon';
import { UndoIcon } from '../icons/UndoIcon';
import type { AppRouter } from '../../server/routers/_app';
import { optimisticallyUpdateCourseProgress, rollbackCourseProgress } from '../../utils/optimisticCourseProgress';

// Feedback section component used by both desktop and mobile
type FeedbackSectionProps = {
  resourceFeedback: ResourceFeedbackValue;
  onFeedback: (feedbackValue: ResourceFeedbackValue) => void;
  variant: 'desktop' | 'mobile';
};

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ resourceFeedback, onFeedback, variant }) => {
  const gapClass = variant === 'mobile' ? 'gap-1' : 'gap-1';

  const renderButton = (feedbackValue: ResourceFeedbackValue) => {
    const isActive = feedbackValue === resourceFeedback;
    const isLikeButton = feedbackValue === RESOURCE_FEEDBACK.LIKE;

    const activeBackground = isLikeButton ? 'bg-[rgba(0,55,255,0.06)]' : 'bg-bluedot-navy/10';
    const hoverBackground = 'hover:bg-bluedot-navy/8';

    const baseClasses = 'flex flex-row justify-center items-center px-2 py-1.5 h-[30px] rounded-md border-none transition-all duration-200 font-medium text-[13px] leading-[140%] tracking-[-0.005em] cursor-pointer';
    const buttonGapClass = variant === 'mobile' ? 'gap-2' : 'gap-1.5';
    const opacityClass = isActive ? 'opacity-100' : 'opacity-60';
    const bgClass = isActive ? activeBackground : 'bg-transparent';

    let textColorClass = 'text-bluedot-navy';
    if (isActive && isLikeButton) {
      textColorClass = 'text-[#2244bb]';
    }

    // Flip vertically for dislike (thumbs down) by flipping on Y-axis
    const transform = isLikeButton ? undefined : 'scale(1, -1) translate(0, -16)';

    return (
      <button
        type="button"
        onClick={() => onFeedback(feedbackValue)}
        className={`${baseClasses} ${buttonGapClass} ${opacityClass} ${bgClass} ${textColorClass} ${!isActive && hoverBackground}`}
        aria-label={`${isLikeButton ? 'Like' : 'Dislike'} this resource${isActive ? ' (selected)' : ''}`}
        aria-pressed={isActive}
      >
        <ThumbIcon filled={isActive} transform={transform} />
        {isLikeButton ? 'Like' : 'Dislike'}
      </button>
    );
  };

  return (
    <div className={`flex items-center ${gapClass}`}>
      {renderButton(RESOURCE_FEEDBACK.LIKE)}
      {renderButton(RESOURCE_FEEDBACK.DISLIKE)}
    </div>
  );
};

type ResourceListItemProps = {
  resource: UnitResource;
  resourceCompletion?: ResourceCompletion;
  courseSlug?: string;
  unitNumber?: string;
  chunkIndex?: number;
};

export const ResourceListItem: React.FC<ResourceListItemProps> = ({
  resource, resourceCompletion, courseSlug, unitNumber, chunkIndex,
}) => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();
  const [isHovered, setIsHovered] = useState(false);
  const [feedback, setFeedback] = useState(resourceCompletion?.feedback ?? '');
  const lastSavedFeedback = useRef<string>(resourceCompletion?.feedback ?? '');

  const queryClient = useQueryClient();
  const resourceCompletionsQueryKey = getQueryKey(trpc.resources.getResourceCompletions, undefined, 'query');

  const saveCompletionMutation = trpc.resources.saveResourceCompletion.useMutation({
    onSettled() {
      utils.resources.getResourceCompletions.invalidate();
      utils.courses.getCourseProgress.invalidate();
    },
    async onMutate(newData) {
      // Optimistically update `getResourceCompletions` so that the Sidebar immediately updates
      await utils.resources.getResourceCompletions.cancel();

      const previousQueriesData = queryClient.getQueriesData({ queryKey: resourceCompletionsQueryKey });

      queryClient.setQueriesData(
        { queryKey: resourceCompletionsQueryKey },
        (oldData: inferRouterOutputs<AppRouter>['resources']['getResourceCompletions']) => {
          if (!oldData) {
            return [];
          }

          // Create a shallow copy for safe mutation
          const newArray = [...oldData];

          const { unitResourceId, ...updatedFields } = newData;

          const existingIndex = oldData.findIndex((item) => item.unitResourceId === resource.id);

          if (newArray[existingIndex]) {
            // If an existing item is found, update it
            newArray[existingIndex] = {
              ...newArray[existingIndex],
              ...updatedFields,
            };
          } else if (newData.isCompleted) {
            // If no existing item and isCompleted is true, add a new item
            newArray.push({
              id: unitResourceId,
              autoNumberId: null,
              email: auth?.email ?? '',
              unitResourceId,
              rating: updatedFields.rating ?? null,
              feedback: updatedFields.feedback ?? '',
              resourceFeedback: updatedFields.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
              isCompleted: updatedFields.isCompleted ?? false,
            });
          }

          return newArray;
        },
      );

      // Optimistically update overall course progress
      const isCompletionChange = newData.isCompleted !== undefined && newData.isCompleted !== (resourceCompletion?.isCompleted ?? false);
      const previousCourseProgress = isCompletionChange ? await optimisticallyUpdateCourseProgress(utils, courseSlug, unitNumber, chunkIndex, newData.isCompleted ? 1 : -1) : undefined;

      return { previousQueriesData, previousCourseProgress };
    },
    onError(_err, _variables, mutationResult) {
      mutationResult?.previousQueriesData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      rollbackCourseProgress(utils, courseSlug, mutationResult?.previousCourseProgress);
    },
  });

  // Derive `isCompleted` and `resourceFeedback` from mutation variables (for optimistic updates) or fetched data (on first load)
  // Only use mutation variables if mutation hasn't failed (to support rollback on error)
  const isCompleted = (!saveCompletionMutation.isError && saveCompletionMutation.variables?.isCompleted !== undefined)
    ? saveCompletionMutation.variables.isCompleted
    : (resourceCompletion?.isCompleted ?? false);
  const resourceFeedback = (!saveCompletionMutation.isError && saveCompletionMutation.variables?.resourceFeedback !== undefined)
    ? saveCompletionMutation.variables.resourceFeedback
    : (resourceCompletion?.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE);

  // Sync feedback state with server data (skip if it's just our own save coming back)
  useEffect(() => {
    const serverFeedback = resourceCompletion?.feedback ?? '';
    if (serverFeedback === lastSavedFeedback.current) {
      return;
    }

    setFeedback(serverFeedback);
    lastSavedFeedback.current = serverFeedback;
  }, [resourceCompletion?.feedback]);

  const handleSaveCompletion = useCallback((
    updatedIsCompleted: boolean | undefined,
    updatedResourceFeedback?: ResourceFeedbackValue,
    updatedTextFeedback?: string,
  ) => {
    if (!auth) {
      return Promise.resolve();
    }

    return saveCompletionMutation.mutateAsync({
      unitResourceId: resource.id,
      isCompleted: updatedIsCompleted ?? isCompleted,
      resourceFeedback: updatedResourceFeedback ?? resourceFeedback,
      feedback: updatedTextFeedback,
    });
  }, [auth, isCompleted, resourceFeedback, resource.id, saveCompletionMutation]);

  // Handle marking resource as complete
  const handleToggleComplete = useCallback((newIsCompleted = !isCompleted) => {
    // We catch the error to prevent "Unhandled Promise Rejection"
    // UI rollback is handled by the mutation's `onError` callback
    handleSaveCompletion(newIsCompleted).catch(() => {
      // Do nothing
    });
  }, [isCompleted, handleSaveCompletion]);

  // Handle like/dislike feedback
  const handleFeedback = useCallback((feedbackValue: ResourceFeedbackValue) => {
    // Toggle off if clicking the same feedback button
    const newFeedback = resourceFeedback === feedbackValue ? RESOURCE_FEEDBACK.NO_RESPONSE : feedbackValue;
    handleSaveCompletion(true, newFeedback, feedback || '').catch(() => {
      // Do nothing
    });
  }, [resourceFeedback, feedback, handleSaveCompletion]);

  return (
    <li className="resource-item-wrapper">
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
                    return 'bg-bluedot-normal border-none';
                  }

                  if (isHovered) {
                    return 'bg-[rgba(42,45,52,0.05)] border border-[rgba(42,45,52,0.6)]';
                  }

                  return 'bg-[#FCFBF9] border border-bluedot-navy/20';
                })()
              }`}
            >
              {(isCompleted || isHovered) && (
                <CheckmarkIcon variant={isCompleted ? 'completed' : 'hover'} />
              )}
            </button>
          </div>
        )}

        {/* Main resource card */}
        <div className="resource-item container-lined relative z-[1] bg-white p-6">
          {/* Resource title and link */}
          {resource.resourceLink ? (
            <a
              href={addQueryParam(resource.resourceLink, 'utm_source', 'bluedot-impact')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2"
              aria-label={`${resource.resourceName} (opens in new tab)`}
            >
              <FaviconImage url={resource.resourceLink} displaySize={16} className="mt-[3px]" />
              <span className="leading-[140%] font-semibold tracking-[-0.005em] text-inherit no-underline transition-colors hover:text-bluedot-normal hover:underline">
                {resource.resourceName}
                {/* External link icon - inline so it flows with text on wrap */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  stroke="var(--bluedot-navy)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block align-middle ml-2"
                >
                  <path d="M9.14286 2.28613H13.7143M13.7143 2.28613V6.85756M13.7143 2.28613L8 8.00042M5.71422 3.42871H4.28564C3.18108 3.42871 2.28564 4.32414 2.28564 5.42871V11.7144C2.28564 12.819 3.18108 13.7144 4.28565 13.7144H10.5714C11.6759 13.7144 12.5714 12.819 12.5714 11.7144V10.2859" />
                </svg>
              </span>
            </a>
          ) : (
            resource.resourceName
          )}

          {/* Resource guide */}
          {resource.resourceGuide && (
            <div className="resource-item__guide mt-4">
              <MarkdownExtendedRenderer className="text-gray-700 text-[15px] font-normal leading-[160%] tracking-[-0.002em]">
                {resource.resourceGuide}
              </MarkdownExtendedRenderer>
            </div>
          )}

          {/* Author and time metadata */}
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {(resource.authors || resource.year || resource.timeFocusOnMins || resource.syncedAudioUrl) && (
            <div className="resource-item__bottom-metadata mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
              <P className="text-gray-600 text-[13px] font-medium leading-[140%] tracking-[-0.005em]">
                {resource.authors && <span>{resource.authors}</span>}
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {resource.authors && (resource.year || resource.timeFocusOnMins) && <span> · </span>}
                {resource.year && <span>{resource.year}</span>}
                {resource.year && resource.timeFocusOnMins && <span> · </span>}
                {resource.timeFocusOnMins && <span>{resource.timeFocusOnMins} min</span>}
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {resource.syncedAudioUrl && (resource.timeFocusOnMins || resource.year || resource.authors) && <span> ·</span>}
              </P>

              {/* Listen to article button */}
              {resource.syncedAudioUrl && (
                <ListenToArticleButton
                  audioUrl={resource.syncedAudioUrl}
                  resourceTitle={resource.resourceName}
                />
              )}
            </div>
          )}

          {/* Login prompt for unauthenticated users */}
          {!auth && (
            <P className="resource-item__login-prompt mt-4">
              <A href={addQueryParam(addQueryParam(ROUTES.login.url, 'redirect_to', router.asPath), 'register', 'true')}>
                Create a free account
              </A> to track your progress and unlock access to the full course content.
            </P>
          )}

          {/* Mobile feedback section */}
          {auth && (
            <div className="lg:hidden">
              {/* Separator line */}
              <div className="w-full h-0 border-[0.5px] border-bluedot-navy/20 my-4" />

              {/* Bottom action bar */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center p-0 gap-2 min-h-[30px]">
                  {/* Complete/Completed button */}
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(true)}
                      className="flex flex-row justify-center items-center px-2.5 py-1.5 gap-2 w-20 h-[30px] bg-bluedot-normal rounded-md border-none cursor-pointer font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-white transition-all duration-200"
                      aria-label="Mark resource as complete"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(false)}
                      className="flex items-center gap-2 transition-all duration-200 hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
                      aria-label="Mark resource as incomplete"
                    >
                      <span className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-bluedot-normal">
                        Completed
                      </span>
                      <UndoIcon className="text-bluedot-normal" />
                    </button>
                  )}

                  {/* Feedback buttons - only show when there's an actual completion record */}
                  {isCompleted && (
                    <div>
                      <FeedbackSection
                        resourceFeedback={resourceFeedback}
                        onFeedback={handleFeedback}
                        variant="mobile"
                      />
                    </div>
                  )}
                </div>

                {/* Text feedback textarea for mobile - only show when there's a completion record and Like or Dislike is selected */}
                {isCompleted && (resourceFeedback !== RESOURCE_FEEDBACK.NO_RESPONSE || feedback) && (
                  <RichTextAutoSaveEditor
                    value={feedback}
                    onChange={setFeedback}
                    onSave={async (value) => {
                      lastSavedFeedback.current = value || '';
                      await handleSaveCompletion(isCompleted, resourceFeedback, value || '');
                    }}
                    placeholder="What did or didn't you find useful about this resource?"
                    height="short"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop feedback section - only show when there's an actual completion record */}
        {auth && isCompleted && (
          <div className="hidden lg:block">
            <div
              className={`hidden lg:flex flex-col transition-all duration-200 pt-[23px] px-4 gap-2 w-full bg-bluedot-navy/5 border-[0.5px] border-bluedot-navy/15 rounded-b-[10px] -mt-4 relative z-0 ${resourceFeedback !== RESOURCE_FEEDBACK.NO_RESPONSE || feedback ? 'pb-4' : 'pb-[9px]'}`}
              role="region"
              aria-label="Resource feedback section"
            >
              <div className="flex items-center gap-3 px-2">
                <P className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-bluedot-navy/60">
                  Was this resource useful?
                </P>
                <FeedbackSection
                  resourceFeedback={resourceFeedback}
                  onFeedback={handleFeedback}
                  variant="desktop"
                />
              </div>
              {/* Only show textarea when Like or Dislike is selected */}
              {isCompleted && (resourceFeedback !== RESOURCE_FEEDBACK.NO_RESPONSE || feedback) && (
                <RichTextAutoSaveEditor
                  value={feedback}
                  onChange={setFeedback}
                  onSave={async (value) => {
                    lastSavedFeedback.current = value || '';
                    await handleSaveCompletion(isCompleted, resourceFeedback, value || '');
                  }}
                  placeholder="What did or didn't you find useful about this resource?"
                  height="short"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
};
