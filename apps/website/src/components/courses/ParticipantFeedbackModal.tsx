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

// --- RubricSelector ---

export type RubricOption = {
  value: number;
  label: string;
  description: string;
};

type RubricSelectorProps = {
  name: string;
  label: string;
  description: string;
  options: RubricOption[];
  value: number | null;
  onChange: (value: number) => void;
};

export const RubricSelector: React.FC<RubricSelectorProps> = ({ name, label, description, options, value, onChange }) => {
  const labelId = `${name}-label`;
  return (
    <div role="radiogroup" aria-labelledby={labelId}>
      <p id={labelId} className="font-medium">{label}</p>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex gap-3 border rounded p-3 mb-1 cursor-pointer ${isSelected ? 'border-bluedot-normal bg-blue-50' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
            />
            <span className="font-medium text-sm w-6 text-center shrink-0">{option.value}</span>
            <div>
              <span className="text-sm">{option.label}</span>
              {isSelected && (
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
