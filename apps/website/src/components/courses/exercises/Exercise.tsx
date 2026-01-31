import React, { useRef, useState } from 'react';
import {
  cn, ProgressDots, ToggleSwitch, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
// TODO fix these import cycles
// eslint-disable-next-line import/no-cycle
import GroupResponses from './GroupResponses';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { CheckmarkIcon } from '../../icons/CheckmarkIcon';
import { trpc } from '../../../utils/trpc';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();
  const router = useRouter();
  const courseSlug = typeof router.query.courseSlug === 'string' ? router.query.courseSlug : undefined;

  // TODO give this a more exactly correct name, and flip it to something like showGroupResponsesIfFacilitator
  const [showMyResponse, setShowMyResponse] = useState(false);
  // TODO IMO this should be pushed into the child, fine to do data fetching in that component
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  // TODO checkboxHovered is overcomplicated IMO, couldn't this just be a CSS selector? Fine if we technically reduce functionality
  const [checkboxHovered, setCheckboxHovered] = useState(false);

  const {
    data: exerciseData,
    isLoading: exerciseLoading,
    error: exerciseError,
  } = trpc.exercises.getExercise.useQuery({ exerciseId });

  // Only fetch user response when authenticated
  const {
    data: responseData,
    isLoading: exerciseResponseLoading,
    error: exerciseResponseError,
  } = trpc.exercises.getExerciseResponse.useQuery(
    { exerciseId },
    { enabled: !!auth },
  );

  // Fetch group responses (tRPC deduplicates this across all Exercise instances on the page)
  const {
    data: facilitatorGroupResponses,
  } = trpc.exercises.getGroupExerciseResponses.useQuery(
    { courseSlug: courseSlug!, groupId: selectedGroupId },
    { enabled: !!auth && !!courseSlug },
  );

  const saveResponseMutation = trpc.exercises.saveExerciseResponse.useMutation({
    onSuccess: async () => {
      // Await this invalidation to ensure mutation is kept in loading state until data is refetched.
      // Without this we get a UI flash where the mutation is complete but the new response data hasn't yet loaded.
      await utils.exercises.getExerciseResponse.invalidate({ exerciseId });
    },
  });

  // Prevent concurrent saves to avoid race condition creating duplicate records
  // Concurrent saves can happen e.g. when a blur and click event both trigger saves
  const isSavingRef = useRef(false);

  // Optimistically update `isCompleted` using mutation variables.
  // Note: generally use onMutate/onSettled if doing optimistic updates of whole
  // objects, this is just a simple workaround for this one field.
  const isCompleted = (!saveResponseMutation.isError && saveResponseMutation.variables?.completed !== undefined)
    ? saveResponseMutation.variables.completed
    : (responseData?.completed ?? false);

  const handleExerciseSubmit = async (exerciseResponse: string, completed?: boolean) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      await saveResponseMutation.mutateAsync({
        exerciseId,
        response: exerciseResponse,
        completed, // undefined means "don't change", backend preserves existing value
      });
    } finally {
      isSavingRef.current = false;
    }
  };

  if (exerciseLoading || exerciseResponseLoading) {
    return <ProgressDots />;
  }

  if (exerciseError || exerciseResponseError) {
    return <ErrorView error={exerciseError || exerciseResponseError} />;
  }

  if (!exerciseData) {
    return <ErrorView error={new Error('Exercise not found')} />;
  }

  const groupResponses = facilitatorGroupResponses?.responses[exerciseId] || [];
  const showFacilitatorView = !!facilitatorGroupResponses && !showMyResponse;

  // Free text completion checkbox (positioned outside the card)
  const hasResponse = !!(responseData?.response?.trim());
  const checkboxDisabled = !isCompleted && !hasResponse;
  const showCheckbox = !!auth && exerciseData.type === 'Free text' && !showFacilitatorView;

  const renderContent = () => {
    if (showFacilitatorView) {
      return (
        <GroupResponses
          responses={groupResponses}
          totalParticipants={facilitatorGroupResponses.totalParticipants}
          groups={facilitatorGroupResponses.groups}
          selectedGroupId={selectedGroupId || facilitatorGroupResponses.selectedGroupId}
          onGroupChange={setSelectedGroupId}
        />
      );
    }

    switch (exerciseData.type) {
      case 'Free text':
        return (
          <FreeTextResponse
            exerciseResponse={responseData?.response}
            isCompleted={isCompleted}
            isLoggedIn={!!auth}
            onExerciseSubmit={handleExerciseSubmit}
          />
        );
      case 'Multiple choice':
        return (
          <MultipleChoice
            answer={exerciseData.answer || ''}
            options={exerciseData.options || ''}
            exerciseResponse={responseData?.response}
            isLoggedIn={!!auth}
            onExerciseSubmit={handleExerciseSubmit}
          />
        );
      default:
        return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.type}'`)} />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {facilitatorGroupResponses && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#13132E]">Show my response</span>
            <ToggleSwitch
              checked={showMyResponse}
              onChange={setShowMyResponse}
              aria-label="Show my response"
            />
          </div>
        </div>
      )}
      <div className="relative">
        {showCheckbox && (
          <div className="absolute hidden lg:block -left-[calc(24px+clamp(12px,3vw,24px))] top-6 z-[1]">
            <button
              type="button"
              onClick={() => handleExerciseSubmit(responseData?.response || '', !isCompleted)}
              disabled={checkboxDisabled}
              onMouseEnter={() => setCheckboxHovered(true)}
              onMouseLeave={() => setCheckboxHovered(false)}
              aria-label={`Mark as ${isCompleted ? 'incomplete' : 'complete'}`}
              className={cn(
                'size-6 rounded-full flex items-center justify-center p-0 transition-all duration-300 box-border',
                checkboxDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
                isCompleted && 'bg-bluedot-normal border-none',
                !isCompleted && checkboxHovered && !checkboxDisabled && 'bg-[rgba(42,45,52,0.05)] border border-[rgba(42,45,52,0.6)]',
                !isCompleted && !(checkboxHovered && !checkboxDisabled) && 'bg-[#FCFBF9] border border-[rgba(19,19,46,0.2)]',
              )}
            >
              {(isCompleted || (checkboxHovered && !checkboxDisabled)) && (
                <CheckmarkIcon variant={isCompleted ? 'completed' : 'hover'} />
              )}
            </button>
          </div>
        )}
        {/* TODO try to remove these `showFacilitatorView` checks */}
        <div className={cn('container-lined bg-white flex flex-col gap-5', !showFacilitatorView && 'p-8')}>
          <div className={cn('flex flex-col gap-2', showFacilitatorView && 'px-8 pt-8')}>
            <p className="bluedot-h4 not-prose">{exerciseData.title || ''}</p>
            <MarkdownExtendedRenderer>{exerciseData.description || ''}</MarkdownExtendedRenderer>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Exercise;
