type ParticipantFeedbackModalProps = {
  participant: { id: string; name: string };
  open: boolean;
  onClose: () => void;
  onSave: () => void;
};

const ParticipantFeedbackModal: React.FC<ParticipantFeedbackModalProps> = ({ participant, open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium">{participant.name}</p>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <p className="text-gray-500">TODO: modal content</p>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="bg-bluedot-normal text-white px-4 py-2 rounded">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantFeedbackModal;
