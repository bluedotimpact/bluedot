import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  cn, ProgressDots, ToggleSwitch, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';

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
    onSettled() {
      utils.courses.getCourseProgress.invalidate({ courseSlug });
      utils.exercises.getExerciseResponse.invalidate({ exerciseId });
    },
    async onMutate(newData) {
      await utils.exercises.getExerciseResponse.cancel({ exerciseId });
      const previousResponse = utils.exercises.getExerciseResponse.getData({ exerciseId });

      let newCompletedAt: string | null;
      if (newData.completed === true) {
        newCompletedAt = new Date().toISOString();
      } else if (newData.completed === false) {
        newCompletedAt = null;
      } else {
        newCompletedAt = previousResponse?.completedAt ?? null;
      }

      utils.exercises.getExerciseResponse.setData({ exerciseId }, {
        id: previousResponse?.id ?? 'optimistic',
        email: previousResponse?.email ?? auth?.email ?? '',
        exerciseId,
        response: newData.response,
        completedAt: newCompletedAt,
        autoNumberId: previousResponse?.autoNumberId ?? null,
      });

      const previousCourseProgress = newData.completed !== undefined ? await optimisticallyUpdateCourseProgress(utils, courseSlug, unitNumber, chunkIndex, newData.completed ? 1 : -1) : undefined;
      return { previousResponse, previousCourseProgress };
    },
    onError(_err, _variables, mutationResult) {
      if (mutationResult) {
        utils.exercises.getExerciseResponse.setData({ exerciseId }, mutationResult.previousResponse ?? undefined);
      }

      rollbackCourseProgress(utils, courseSlug, mutationResult?.previousCourseProgress);
    },
  });

  // Prevent concurrent saves to avoid race condition creating duplicate records
  // Concurrent saves can happen e.g. when a blur and click event both trigger saves
  const isSavingRef = useRef(false);

  const isCompleted = responseData?.completedAt != null;

  const handleExerciseSubmit = async (exerciseResponse: string, completed?: boolean) => {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      await saveResponseMutation.mutateAsync({
        exerciseId,
        response: exerciseResponse,
        completed, // undefined means "don't change", backend preserves existing value
      });
    } catch {
      // Rollback handled by onError
    } finally {
      isSavingRef.current = false;
    }
  };

  if (exerciseLoading || exerciseResponseLoading) {
    return <ProgressDots />;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (exerciseError || exerciseResponseError) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
            exerciseResponse={responseData?.response ?? undefined}
            isCompleted={isCompleted}
            isLoggedIn={!!auth}
            onExerciseSubmit={handleExerciseSubmit}
            onTextChange={handleEditorTextChange}
          />
        );
      case 'Multiple choice':
        return (
          <MultipleChoice
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            answer={exerciseData.answer || ''}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            options={exerciseData.options || ''}
            exerciseResponse={responseData?.response ?? undefined}
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
            <span className="text-[13px] font-medium text-bluedot-navy">Show my group's responses</span>
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
                !isCompleted && !(checkboxHovered && !checkboxDisabled) && 'bg-[#FCFBF9] border border-bluedot-navy/20',
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
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
            <p className="bluedot-h4 not-prose">{exerciseData.title || ''}</p>
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
            <MarkdownExtendedRenderer>{exerciseData.description || ''}</MarkdownExtendedRenderer>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Exercise;
