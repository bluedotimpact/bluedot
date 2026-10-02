import {
  ErrorSection, Modal, ProgressDots,
} from '@bluedot/ui';
import { trpc } from '../../utils/trpc';
import ParticipantRow from './ParticipantRow';

type ViewParticipantsModalProps = {
  groupId: string;
  handleClose: () => void;
};

const ViewParticipantsModal = ({ groupId, handleClose }: ViewParticipantsModalProps) => {
  const { data, isLoading, error } = trpc.meetPerson.getGroupParticipants.useQuery({ groupId });

  const facilitators = data?.facilitators ?? [];
  const participants = data?.participants ?? [];
  const isEmpty = !isLoading && !error && facilitators.length === 0 && participants.length === 0;

  return (
    <Modal
      isOpen
      setIsOpen={(v) => {
        if (!v) handleClose();
      }}
      title="Participants"
      bottomDrawerOnMobile
      ariaLabel="Participants in your group"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          {isLoading && <ProgressDots />}
          {error && <ErrorSection error={error} />}
          {isEmpty && (
            <p className="text-size-xs text-bluedot-navy/60 py-2">No other participants in your group yet.</p>
          )}
          {facilitators.map((p) => (
            <ParticipantRow key={p.id} name={p.name} rightHandNode={<span className="text-size-xxs font-medium text-bluedot-navy/60">Facilitator</span>} />
          ))}
          {participants.map((p) => (
            <ParticipantRow key={p.id} name={p.name} />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ViewParticipantsModal;
