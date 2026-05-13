import { ErrorSection, Modal, ProgressDots } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';
import ParticipantRow from './ParticipantRow';

type ViewParticipantsModalProps = {
  meetPersonId: string;
  handleClose: () => void;
};

const ViewParticipantsModal = ({ meetPersonId, handleClose }: ViewParticipantsModalProps) => {
  const { data, isLoading, error } = trpc.meetPerson.getGroupParticipants.useQuery({ meetPersonId });

  const facilitators = data?.facilitators ?? [];
  const participants = data?.participants ?? [];
  const isEmpty = !isLoading && !error && facilitators.length === 0 && participants.length === 0;

  return (
    <Modal
      isOpen
      setIsOpen={(v) => {
        if (!v) handleClose();
      }}
      title={<span className="font-bold text-size-md text-bluedot-navy">Participants</span>}
      desktopHeaderClassName="h-[73px] py-0 px-6 mb-0 border-b border-gray-200"
      bottomDrawerOnMobile
      ariaLabel="Participants in your group"
    >
      <div className="w-full md:w-[480px] flex flex-col gap-4 pt-0 sm:pt-5">
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
