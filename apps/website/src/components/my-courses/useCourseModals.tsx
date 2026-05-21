import { useState, type ReactNode } from 'react';
import DropoutModal from '../courses/DropoutModal';
import FacilitatorSwitchModal, {
  type FacilitatorModalType, type FacilitatorSwitchType,
} from '../courses/FacilitatorSwitchModal';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import ViewParticipantsModal from '../courses/ViewParticipantsModal';

type GroupSwitchInitial = { initialUnitNumber: string; initialSwitchType: SwitchType };

type FacilitatorSwitchInitial = {
  initialModalType: FacilitatorModalType;
  initialSwitchType?: FacilitatorSwitchType;
  initialDiscussion: { id: string; group: string } | null;
  initialGroupId?: string;
};

export type CourseModalsContext = {
  courseSlug: string;
  courseRegistrationId: string;
  /** Used by DropoutModal. */
  currentRoundId: string | null;
  /** Used by GroupSwitchModal and FacilitatorSwitchModal. */
  switchRoundId: string | null;
  groupId: string | null;
};

export type CourseModalTriggers = {
  openDropout: () => void;
  openViewParticipants: () => void;
  openParticipantReschedule: (init: GroupSwitchInitial) => void;
  openFacilitatorRescheduleRecurring: () => void;
  openFacilitatorRescheduleOneOff: (discussion: { id: string; group: string }) => void;
  openFacilitatorAssignSubstitute: (discussion: { id: string; group: string }) => void;
};

export const useCourseModals = (ctx: CourseModalsContext): CourseModalTriggers & { element: ReactNode } => {
  const [dropoutOpen, setDropoutOpen] = useState(false);
  const [viewParticipantsOpen, setViewParticipantsOpen] = useState(false);
  const [groupSwitch, setGroupSwitch] = useState<GroupSwitchInitial | null>(null);
  const [facilitatorSwitch, setFacilitatorSwitch] = useState<FacilitatorSwitchInitial | null>(null);

  const element = (
    <>
      {dropoutOpen && (
        <DropoutModal
          applicantId={ctx.courseRegistrationId}
          courseSlug={ctx.courseSlug}
          currentRoundId={ctx.currentRoundId}
          handleClose={() => setDropoutOpen(false)}
        />
      )}
      {viewParticipantsOpen && ctx.groupId && (
        <ViewParticipantsModal
          groupId={ctx.groupId}
          handleClose={() => setViewParticipantsOpen(false)}
        />
      )}
      {groupSwitch && ctx.switchRoundId && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitch(null)}
          initialUnitNumber={groupSwitch.initialUnitNumber}
          initialSwitchType={groupSwitch.initialSwitchType}
          courseSlug={ctx.courseSlug}
          roundId={ctx.switchRoundId}
        />
      )}
      {facilitatorSwitch && ctx.switchRoundId && (
        <FacilitatorSwitchModal
          handleClose={() => setFacilitatorSwitch(null)}
          roundId={ctx.switchRoundId}
          initialDiscussion={facilitatorSwitch.initialDiscussion}
          initialGroupId={facilitatorSwitch.initialGroupId}
          initialModalType={facilitatorSwitch.initialModalType}
          initialSwitchType={facilitatorSwitch.initialSwitchType}
        />
      )}
    </>
  );

  return {
    element,
    openDropout: () => setDropoutOpen(true),
    openViewParticipants: () => setViewParticipantsOpen(true),
    openParticipantReschedule: setGroupSwitch,
    openFacilitatorRescheduleRecurring: () => setFacilitatorSwitch({
      initialModalType: 'Update discussion time',
      initialSwitchType: 'Change permanently',
      initialDiscussion: null,
      initialGroupId: ctx.groupId ?? undefined,
    }),
    openFacilitatorRescheduleOneOff: (discussion) => setFacilitatorSwitch({
      initialModalType: 'Update discussion time',
      initialSwitchType: 'Change for one unit',
      initialDiscussion: discussion,
    }),
    openFacilitatorAssignSubstitute: (discussion) => setFacilitatorSwitch({
      initialModalType: 'Change facilitator',
      initialDiscussion: discussion,
    }),
  };
};
