import React, { useRef, useState } from 'react';
import {
  cn, ProgressDots, ToggleSwitch, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
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
  const devAllGroups = router.query.devAllGroups === 'true';

  const [showMyResponse, setShowMyResponse] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
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
    data: groupData,
  } = trpc.exercises.getGroupExerciseResponses.useQuery(
    { courseSlug: courseSlug!, groupId: selectedGroupId, allGroups: devAllGroups || undefined },
    { enabled: !!auth && !!courseSlug },
  );

  const saveResponseMutation = trpc.exercises.saveExerciseResponse.useMutation({
    onSuccess: async () => {
      await utils.exercises.getExerciseResponse.invalidate({ exerciseId });
    },
  });

  const isSavingRef = useRef(false);

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
        completed,
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

  const isFacilitator = !!groupData;
  const groupResponses = groupData?.responses[exerciseId] || [];
  const showFacilitatorView = isFacilitator && !showMyResponse;

  const facilitatorHeader = isFacilitator ? (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 cursor-pointer select-none">
        <span className="text-[13px] text-[#6B7280]">Show my response</span>
        <ToggleSwitch
          checked={showMyResponse}
          onChange={setShowMyResponse}
          aria-label="Show my response"
        />
      </div>
    </div>
  ) : undefined;

  if (showFacilitatorView) {
    return (
      <div className="flex flex-col gap-2">
        {facilitatorHeader}
        <div className="container-lined bg-white flex flex-col gap-6">
          <div className="flex flex-col gap-2 px-8 pt-8">
            <p className="bluedot-h4 not-prose">{exerciseData.title || ''}</p>
            <MarkdownExtendedRenderer>{exerciseData.description || ''}</MarkdownExtendedRenderer>
          </div>
          <GroupResponses
            responses={groupResponses}
            totalParticipants={groupData.totalParticipants}
            groups={groupData.groups}
            selectedGroupId={selectedGroupId || groupData.selectedGroupId}
            onGroupChange={setSelectedGroupId}
          />
        </div>
      </div>
    );
  }

  switch (exerciseData.type) {
    case 'Free text': {
      const hasResponse = !!(responseData?.response?.trim());
      const checkboxDisabled = !isCompleted && !hasResponse;
      return (
        <div className="flex flex-col gap-2">
          {facilitatorHeader}
          <div className="relative">
            {/* Desktop "complete" checkbox */}
            {!!auth && (
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
            <div className="container-lined bg-white p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="bluedot-h4 not-prose">{exerciseData.title || ''}</p>
                <MarkdownExtendedRenderer>{exerciseData.description || ''}</MarkdownExtendedRenderer>
              </div>
              <FreeTextResponse
                exerciseResponse={responseData?.response}
                isCompleted={isCompleted}
                isLoggedIn={!!auth}
                onExerciseSubmit={handleExerciseSubmit}
              />
            </div>
          </div>
        </div>
      );
    }
    case 'Multiple choice':
      return (
        <div className="flex flex-col gap-2">
          {facilitatorHeader}
          <div className="container-lined bg-white p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="bluedot-h4 not-prose">{exerciseData.title || ''}</p>
              <MarkdownExtendedRenderer>{exerciseData.description || ''}</MarkdownExtendedRenderer>
            </div>
            <MultipleChoice
              answer={exerciseData.answer || ''}
              options={exerciseData.options || ''}
              exerciseResponse={responseData?.response}
              isLoggedIn={!!auth}
              onExerciseSubmit={handleExerciseSubmit}
            />
          </div>
        </div>
      );
    default:
      return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.type}'`)} />;
  }
};

export default Exercise;
