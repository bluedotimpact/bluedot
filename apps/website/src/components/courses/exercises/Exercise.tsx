import React, { useCallback, useRef, useState } from 'react';
import {
  cn, ProgressDots, ToggleSwitch, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
// eslint-disable-next-line import/no-cycle
import GroupResponses from './GroupResponses';
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { CheckmarkIcon } from '../../icons/CheckmarkIcon';
import { trpc } from '../../../utils/trpc';
import { optimisticallyUpdateCourseProgress, rollbackCourseProgress } from '../../../utils/optimisticCourseProgress';

type ExerciseProps = {
  exerciseId: string;
  courseSlug?: string;
  unitNumber?: string;
  chunkIndex?: number;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId, courseSlug, unitNumber, chunkIndex,
}) => {
  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();

  const [showGroupResponsesIfFacilitator, setShowGroupResponsesIfFacilitator] = useState(true);
  const [checkboxHovered, setCheckboxHovered] = useState(false);
  const [editorHasText, setEditorHasText] = useState(false);
  const editorTextRef = useRef<string>('');
  const handleEditorTextChange = useCallback((text: string) => {
    editorTextRef.current = text;
    setEditorHasText(text.trim().length > 0);
  }, []);

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

  // Fetch group responses for this exercise (returns null for non-facilitators)
  const {
    data: facilitatorGroupResponses,
  } = trpc.exercises.getGroupExerciseResponses.useQuery(
    { courseSlug: courseSlug ?? '', exerciseId },
    { enabled: !!auth && !!courseSlug },
  );

  const saveResponseMutation = trpc.exercises.saveExerciseResponse.useMutation({
    onSettled: () => {
      utils.courses.getCourseProgress.invalidate({ courseSlug });
    },
    onSuccess: async () => {
      await utils.exercises.getExerciseResponse.invalidate({ exerciseId });
    },
    onMutate: async (newData) => {
      const previousCourseProgress = newData.completed !== undefined ? await optimisticallyUpdateCourseProgress(utils, courseSlug, unitNumber, chunkIndex, newData.completed ? 1 : -1) : undefined;
      return { previousCourseProgress };
    },
    onError: (_err, _variables, mutationResult) => {
      rollbackCourseProgress(utils, courseSlug, mutationResult?.previousCourseProgress);
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
    : (responseData?.completedAt != null);

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

  const showGroupResponses = !!facilitatorGroupResponses && showGroupResponsesIfFacilitator;

  // Free text completion checkbox (positioned outside the card)
  const hasResponse = editorHasText || !!(responseData?.response?.trim());
  const checkboxDisabled = !isCompleted && !hasResponse;
  const showCheckbox = !!auth && exerciseData.type === 'Free text' && !showGroupResponses;

  const renderContent = () => {
    if (showGroupResponses) {
      return (
        <GroupResponses
          groups={facilitatorGroupResponses?.groups ?? []}
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
            onTextChange={handleEditorTextChange}
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
            <span className="text-[13px] font-medium text-[#13132E]">Show my group's responses</span>
            <ToggleSwitch
              checked={showGroupResponsesIfFacilitator}
              onChange={setShowGroupResponsesIfFacilitator}
              aria-label="Show my group's responses"
            />
          </div>
        </div>
      )}
      <div className="relative">
        {showCheckbox && (
          <div className="absolute hidden lg:block -left-[calc(24px+clamp(12px,3vw,24px))] top-6 z-[1]">
            <button
              type="button"
              onClick={() => handleExerciseSubmit(editorTextRef.current, !isCompleted)}
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
        {/* Conditional padding: GroupResponses needs edge-to-edge for its blue background */}
        <div className={cn('container-lined bg-white flex flex-col gap-5', !showGroupResponses && 'p-8')}>
          <div className={cn('flex flex-col gap-2', showGroupResponses && 'px-8 pt-8')}>
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
