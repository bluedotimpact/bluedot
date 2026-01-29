import React, { useRef, useState } from 'react';
import { cn, ProgressDots, useAuthStore } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
// eslint-disable-next-line import/no-cycle
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import GroupResponses from './GroupResponses';
import { trpc } from '../../../utils/trpc';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <span className="text-[13px] text-[#6B7280]">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-bluedot-normal' : 'bg-[#D1D5DB]',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  </label>
);

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const exerciseClassNames = 'exercise';

  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();
  const router = useRouter();
  const courseSlug = typeof router.query.courseSlug === 'string' ? router.query.courseSlug : undefined;
  const devAllGroups = router.query.devAllGroups === 'true';

  const [showMyResponse, setShowMyResponse] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

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

  // Facilitator header bar with toggle and optional group selector
  const facilitatorHeader = isFacilitator ? (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">Exercise</span>
        {groupData.groups.length > 1 && (
          <select
            value={selectedGroupId || groupData.selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="text-[13px] border border-[#D1D5DB] rounded-md px-2 py-1 bg-white text-[#374151]"
          >
            {groupData.groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>
      <ToggleSwitch
        checked={showMyResponse}
        onChange={setShowMyResponse}
        label="Show my response"
      />
    </div>
  ) : null;

  if (showFacilitatorView) {
    return (
      <>
        {facilitatorHeader}
        <GroupResponses
          title={exerciseData.title || ''}
          description={exerciseData.description || ''}
          responses={groupResponses}
        />
      </>
    );
  }

  switch (exerciseData.type) {
    case 'Free text':
      return (
        <>
          {facilitatorHeader}
          <FreeTextResponse
            className={exerciseClassNames}
            {...exerciseData}
            description={exerciseData.description || ''}
            title={exerciseData.title || ''}
            exerciseResponse={responseData?.response}
            isCompleted={isCompleted}
            isLoggedIn={!!auth}
            onExerciseSubmit={handleExerciseSubmit}
          />
        </>
      );
    case 'Multiple choice':
      return (
        <>
          {facilitatorHeader}
          <MultipleChoice
            className={exerciseClassNames}
            {...exerciseData}
            answer={exerciseData.answer || ''}
            title={exerciseData.title || ''}
            description={exerciseData.description || ''}
            options={exerciseData.options || ''}
            exerciseResponse={responseData?.response}
            isLoggedIn={!!auth}
            onExerciseSubmit={handleExerciseSubmit}
          />
        </>
      );
    default:
      return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.type}'`)} />;
  }
};

export default Exercise;
