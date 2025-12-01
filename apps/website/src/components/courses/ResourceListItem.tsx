import {
  useCallback, useEffect, useState,
} from 'react';
import { useRouter } from 'next/router';
import {
  addQueryParam,
  useAuthStore,
} from '@bluedot/ui';
/**
 * Prevents barrel file import errors when importing RESOURCE_FEEDBACK from @bluedot/db
 */
import {
  RESOURCE_FEEDBACK, ResourceFeedbackValue, type ResourceCompletion, type UnitResource,
} from '@bluedot/db/src/schema';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import {
  A, P,
} from '../Text';
import { ROUTES } from '../../lib/routes';
import { FaviconImage } from './FaviconImage';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import ListenToArticleButton from './ListenToArticleButton';
import AutoSaveTextarea from './exercises/AutoSaveTextarea';
import { trpc } from '../../utils/trpc';
import type { AppRouter } from '../../server/routers/_app';

// Simplified SVG icon components
const ThumbIcon: React.FC<{
  filled: boolean;
  color?: string;
  isDislike?: boolean;
}> = ({ filled, color = 'currentColor', isDislike = false }) => {
  // Flip horizontally for dislike (thumbs down) by flipping on Y-axis
  const transform = isDislike ? 'scale(1, -1) translate(0, -16)' : undefined;

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={transform}>
        <path d="M2.5 6.5H5.5V13H2.5C2.36739 13 2.24021 12.9473 2.14645 12.8536C2.05268 12.7598 2 12.6326 2 12.5V7C2 6.86739 2.05268 6.74021 2.14645 6.64645C2.24021 6.55268 2.36739 6.5 2.5 6.5Z" />
        {filled && (
          <path
            d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5"
            fill={color}
          />
        )}
        <path d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5" />
      </g>
    </svg>
  );
};

// Feedback section component used by both desktop and mobile
type FeedbackSectionProps = {
  resourceFeedback: ResourceFeedbackValue;
  onFeedback: (feedbackValue: ResourceFeedbackValue) => void;
  variant: 'desktop' | 'mobile';
};

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ resourceFeedback, onFeedback, variant }) => {
  const gapClass = variant === 'mobile' ? 'gap-1' : 'gap-[1px]';

  const renderButton = (feedbackValue: ResourceFeedbackValue) => {
    const isActive = feedbackValue === resourceFeedback;
    const isLikeButton = feedbackValue === RESOURCE_FEEDBACK.LIKE;

    const activeBackground = isLikeButton ? 'bg-[rgba(34,68,187,0.1)]' : 'bg-[rgba(19,19,46,0.1)]';
    const hoverBackground = 'hover:bg-[rgba(19,19,46,0.08)]';

    const baseClasses = 'flex flex-row justify-center items-center px-2 py-1.5 h-[30px] rounded-md border-none transition-all duration-200 font-medium text-[13px] leading-[140%] tracking-[-0.005em] cursor-pointer';
    const buttonGapClass = variant === 'mobile' ? 'gap-2' : 'gap-1.5';
    const opacityClass = isActive ? 'opacity-100' : 'opacity-60';
    const bgClass = isActive ? activeBackground : 'bg-transparent';

    let textColorClass = 'text-[#13132E]';
    if (isActive && isLikeButton) {
      textColorClass = 'text-[#2244BB]';
    }

    return (
      <button
        type="button"
        onClick={() => onFeedback(feedbackValue)}
        className={`${baseClasses} ${buttonGapClass} ${opacityClass} ${bgClass} ${textColorClass} ${!isActive && hoverBackground}`}
        aria-label={`${isLikeButton ? 'Like' : 'Dislike'} this resource${isActive ? ' (selected)' : ''}`}
        aria-pressed={isActive}
      >
        <ThumbIcon filled={isActive} isDislike={!isLikeButton} />
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
};

export const ResourceListItem: React.FC<ResourceListItemProps> = ({ resource, resourceCompletion }) => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();
  const [isHovered, setIsHovered] = useState(false);
  const [feedback, setFeedback] = useState('');

  const queryClient = useQueryClient();
  const resourceCompletionsQueryKey = getQueryKey(trpc.resources.getResourceCompletions, undefined, 'query');

  const saveCompletionMutation = trpc.resources.saveResourceCompletion.useMutation({
    onSettled: () => {
      utils.resources.getResourceCompletions.invalidate();
    },
    onMutate: async (newData) => {
      // Optimistically update `getResourceCompletions` so that the Sidebar immediately updates
      await utils.resources.getResourceCompletions.cancel();

      const previousQueriesData = queryClient.getQueriesData({ queryKey: resourceCompletionsQueryKey });

      queryClient.setQueriesData(
        { queryKey: resourceCompletionsQueryKey },
        (oldData: inferRouterOutputs<AppRouter>['resources']['getResourceCompletions']) => {
          if (!oldData) return [];

          // Create a shallow copy for safe mutation
          const newArray = [...oldData];

          const { unitResourceId, ...updatedFields } = newData;

          const existingIndex = oldData.findIndex((item) => item.unitResourceIdRead === resource.id);

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
              unitResourceIdRead: unitResourceId,
              unitResourceIdWrite: unitResourceId,
              rating: updatedFields.rating ?? null,
              feedback: updatedFields.feedback ?? '',
              resourceFeedback: updatedFields.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
              isCompleted: updatedFields.isCompleted ?? false,
            });
          }
          return newArray;
        },
      );

      return { previousQueriesData };
    },
    onError: (_err, _variables, mutationResult) => {
      mutationResult?.previousQueriesData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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

  // Sync feedback state with server data (both mutation variables and fetched data)
  useEffect(() => {
    const optimisticFeedback = saveCompletionMutation.variables?.feedback;
    const serverFeedback = resourceCompletion?.feedback;

    // Only use optimistic feedback if there is no error
    if (!saveCompletionMutation.isError && optimisticFeedback !== undefined) {
      setFeedback(optimisticFeedback);
    } else {
      setFeedback(serverFeedback ?? '');
    }
  }, [saveCompletionMutation.variables?.feedback, resourceCompletion?.feedback, saveCompletionMutation.isError]);

  const handleSaveCompletion = useCallback((
    updatedIsCompleted: boolean | undefined,
    updatedResourceFeedback?: ResourceFeedbackValue,
    updatedTextFeedback?: string,
  ) => {
    if (!auth) return Promise.resolve();

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
                  aria-hidden="true"
                >
                  <path d="M2.5 6L5 8.5L9.5 3.5" />
                </svg>
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
              className="flex items-center gap-2"
              aria-label={`${resource.resourceName} (opens in new tab)`}
            >
              <FaviconImage url={resource.resourceLink} displaySize={16} />
              <span className="leading-[140%] font-semibold tracking-[-0.005em] text-inherit no-underline transition-colors hover:text-[#2244BB] hover:underline">
                {resource.resourceName}
              </span>
              {/* External link icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                stroke="#13132E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.14286 2.28613H13.7143M13.7143 2.28613V6.85756M13.7143 2.28613L8 8.00042M5.71422 3.42871H4.28564C3.18108 3.42871 2.28564 4.32414 2.28564 5.42871V11.7144C2.28564 12.819 3.18108 13.7144 4.28565 13.7144H10.5714C11.6759 13.7144 12.5714 12.819 12.5714 11.7144V10.2859" />
              </svg>
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
          {(resource.authors || resource.year || resource.timeFocusOnMins || resource.syncedAudioUrl) && (
            <div className="resource-item__bottom-metadata mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
              <P className="text-gray-600 text-[13px] font-medium leading-[140%] tracking-[-0.005em]">
                {resource.authors && <span>{resource.authors}</span>}
                {resource.authors && (resource.year || resource.timeFocusOnMins) && <span> · </span>}
                {resource.year && <span>{resource.year}</span>}
                {resource.year && resource.timeFocusOnMins && <span> · </span>}
                {resource.timeFocusOnMins && <span>{resource.timeFocusOnMins} min</span>}
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
              <div className="w-full h-0 opacity-20 border-[0.5px] border-[#13132E] my-4" />

              {/* Bottom action bar */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center p-0 gap-2 min-h-[30px]">
                  {/* Complete/Completed button */}
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(true)}
                      className="flex flex-row justify-center items-center px-2.5 py-1.5 gap-2 w-20 h-[30px] bg-[#2244BB] rounded-md border-none cursor-pointer font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-white transition-all duration-200"
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
                      <span className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-[#2244BB]">
                        Completed
                      </span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1.5 3.49994V6.49994M1.5 6.49994H4.5M1.5 6.49994L4.11063 4.11056C4.87508 3.34625 5.84782 2.82415 6.90729 2.60951C7.96677 2.39487 9.06601 2.4972 10.0677 2.90372C11.0693 3.31024 11.929 4.00291 12.5392 4.8952C13.1494 5.78749 13.4832 6.83982 13.4988 7.92071C13.5144 9.0016 13.2111 10.0631 12.6268 10.9726C12.0426 11.8821 11.2033 12.5993 10.2137 13.0345C9.22422 13.4698 8.12838 13.6037 7.06316 13.4197C5.99793 13.2357 5.01055 12.7419 4.22438 11.9999" stroke="#2244BB" strokeWidth="1.25" strokeLinecap="square" />
                      </svg>
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
                  <AutoSaveTextarea
                    value={feedback}
                    onChange={setFeedback}
                    onSave={async (value) => {
                      // Save the draft and await the promise
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
              className="hidden lg:flex flex-col transition-all duration-200 px-6 pt-[17px] pb-4 gap-3 w-full bg-[rgba(19,19,46,0.05)] border-[0.5px] border-[rgba(19,19,46,0.15)] rounded-b-[10px] -mt-[10px] relative z-0"
              role="region"
              aria-label="Resource feedback section"
            >
              <div className="flex items-center gap-2">
                <P className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-[#13132E] opacity-60">
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
                <AutoSaveTextarea
                  value={feedback}
                  onChange={setFeedback}
                  onSave={async (value) => {
                    // Save the draft and await the promise
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
