import { Modal } from '@bluedot/ui';
import { useState } from 'react';

export type ParticipantFeedbackData = {
  showUpRating: number;
  engageRating: number;
  investmentNote: string;
  followUps: Record<string, boolean>;
};

type ParticipantFeedbackModalProps = {
  participant: { id: string; name: string };
  initialData?: ParticipantFeedbackData;
  open: boolean;
  onClose: () => void;
  onSave: (data: ParticipantFeedbackData) => void;
  onNoStrongImpression: () => void;
};

const SHOW_UP_OPTIONS: RubricOption[] = [
  { value: 5, label: 'Went clearly above and beyond', description: 'Brought in outside resources, produced additional work unprompted, reached out to peers or facilitator between discussions, or demonstrated significantly more thinking than required.' },
  { value: 4, label: 'Took clear ownership of their learning', description: 'Showing up as exceptionally well-prepared contributions, thoughtful written responses, or following up on ideas between discussions.' },
  { value: 3, label: 'Consistently prepared and engaged at the expected level', description: 'Reliable participant whose contributions showed they\'d done the work.' },
  { value: 2, label: 'Inconsistently prepared', description: 'Contributions (verbal or written) didn\'t suggest much investment beyond the minimum.' },
  { value: 1, label: 'Frequently unprepared or disengaged', description: 'Little evidence of investment in the material or the cohort beyond showing up.' },
];

const ENGAGE_OPTIONS: RubricOption[] = [
  { value: 5, label: 'Consistently the sharpest thinker in the room', description: 'You found yourself raising your game around them. Introduced framings others hadn\'t considered and engaged with nuance rather than defaulting to simple positions.' },
  { value: 4, label: 'Regularly engaged critically', description: 'Pushed back on ideas, raised non-obvious considerations, or connected concepts across sessions in ways that moved the discussion forward.' },
  { value: 3, label: 'Engaged thoughtfully and applied ideas to new examples', description: 'Could apply concepts to new situations, but tended to accept rather than challenge.' },
  { value: 2, label: 'Occasionally offered a thought but didn\'t develop it', description: 'Could explain concepts in their own words, but mostly stuck to what was presented.' },
  { value: 1, label: 'Mostly quiet or repeated what the readings said', description: 'When asked to elaborate, responses were vague or surface-level.' },
];

const ParticipantFeedbackModal: React.FC<ParticipantFeedbackModalProps> = ({ participant, initialData, open, onClose, onSave, onNoStrongImpression }) => {
  const [showUpRating, setShowUpRating] = useState<number | null>(initialData?.showUpRating ?? null);
  const [engageRating, setEngageRating] = useState<number | null>(initialData?.engageRating ?? null);
  const [investmentNote, setInvestmentNote] = useState(initialData?.investmentNote ?? '');
  const [followUps, setFollowUps] = useState<Record<string, boolean>>(initialData?.followUps ?? {});

  return (
    <Modal
      isOpen={open}
      setIsOpen={(isOpen: boolean) => !isOpen && onClose()}
      title={participant.name}
      bottomDrawerOnMobile
      ariaLabel="Participant feedback"
    >
      <div className="w-full pt-6 max-w-[600px]">
        <div className="w-[600px] max-w-full h-0" />

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">Your responses are only seen by BlueDot staff.</p>
          <button type="button" className="text-sm text-bluedot-normal" onClick={onNoStrongImpression}>
            No strong impression
          </button>
        </div>

        <RubricSelector
          name="show-up"
          label="How did they show up across discussions?"
          description="Think about preparation, initiative, and engagement between sessions."
          options={SHOW_UP_OPTIONS}
          value={showUpRating}
          onChange={setShowUpRating}
        />

        <div className="mt-6">
          <RubricSelector
            name="engage"
            label="How did they engage with ideas during discussions?"
            description="Think about quality of thinking, willingness to challenge, and depth of engagement."
            options={ENGAGE_OPTIONS}
            value={engageRating}
            onChange={setEngageRating}
          />
        </div>

        <div className="mt-6">
          <label htmlFor="investment-note" className="font-medium">
            In 2–3 sentences: what would you tell BlueDot if we asked "how much time should we invest in this person?"
          </label>
          <p className="text-sm text-gray-500 mb-2">Feel free to paste this from your 1:1 report.</p>
          <textarea
            id="investment-note"
            value={investmentNote}
            onChange={(e) => setInvestmentNote(e.target.value)}
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mt-6">
          <p className="font-medium">How should we follow up with them?</p>
          <p className="text-sm text-gray-500 mb-2">Check all that apply.</p>
          {FOLLOW_UP_OPTIONS.map((option) => (
            <label key={option.id} className="flex items-center gap-3 border rounded p-3 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!followUps[option.id]}
                onChange={(e) => setFollowUps({ ...followUps, [option.id]: e.target.checked })}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-6">Changes save when you click "Done"</p>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="bg-bluedot-normal text-white px-4 py-2 rounded"
            onClick={() => {
              if (showUpRating !== null && engageRating !== null) {
                onSave({ showUpRating, engageRating, investmentNote, followUps });
              }
            }}
            disabled={showUpRating === null || engageRating === null}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ParticipantFeedbackModal;

export const FOLLOW_UP_OPTIONS = [
  { id: 'no-action', label: 'No further action needed', airtableValue: 'No further action needed' },
  { id: 'talent-pipeline', label: 'Add to talent pipeline (keep warm) — for future opportunities', airtableValue: 'Add to talent pipeline [keep warm for future opportunities/check-ins]' },
  { id: 'schedule-call', label: 'Schedule a call within the week (high priority)', airtableValue: 'Schedule follow-up call with BlueDot team within ~1 week (high-priority)' },
  { id: 'funding-candidate', label: 'Potential funding candidate — career transition or project support', airtableValue: 'Flag as candidate for funding (career transition/project)' },
  { id: 'invite-facilitator', label: 'Invite to apply as a facilitator', airtableValue: 'Recommend to facilitate' },
];

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
