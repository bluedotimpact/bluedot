import { Modal, P } from '@bluedot/ui';

type ViewParticipantsModalProps = {
  handleClose: () => void;
};

const ViewParticipantsModal = ({ handleClose }: ViewParticipantsModalProps) => {
  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={(
        <div className="flex w-full items-center justify-center gap-2">
          <div className="text-size-md font-semibold">View participants</div>
        </div>
      )}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full p-6 md:w-[600px]">
        <P>TODO, needs implementing.</P>
      </div>
    </Modal>
  );
};

export default ViewParticipantsModal;
