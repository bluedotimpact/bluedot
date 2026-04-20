import { Modal } from '@bluedot/ui';
import { useState } from 'react';
import { FaLock } from 'react-icons/fa6';
import { FOLLOW_UP_OPTIONS } from '../../lib/facilitatorFollowUps';
import { getInitials } from '../../lib/utils';

export type ParticipantFeedbackData = {
  showUpRating: number;
  engageRating: number;
  investmentNote: string;
  followUps: Record<string, boolean>;
};

type ParticipantFeedbackModalProps = {
  participant: { id: string; name: string };
  initialData?: ParticipantFeedbackData;
  isSaving?: boolean;
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

const ParticipantFeedbackModal: React.FC<ParticipantFeedbackModalProps> = ({ participant, initialData, isSaving, onClose, onSave, onNoStrongImpression }) => {
  const [showUpRating, setShowUpRating] = useState<number | null>(initialData?.showUpRating ?? null);
  const [engageRating, setEngageRating] = useState<number | null>(initialData?.engageRating ?? null);
  const [investmentNote, setInvestmentNote] = useState(initialData?.investmentNote ?? '');
  const [followUps, setFollowUps] = useState<Record<string, boolean>>(initialData?.followUps ?? {});
  const hasTopScore = showUpRating === 5 || engageRating === 5;

  return (
    <Modal
      isOpen
      setIsOpen={(v) => {
        if (!v) onClose();
      }}
      title={(
        <div className="flex-1 flex items-center gap-3 pr-3">
          <div className="size-10 rounded-full bg-bluedot-normal flex items-center justify-center text-white text-size-xs font-bold shrink-0">
            {getInitials(participant.name)}
          </div>
          <span className="font-bold text-[16px] text-bluedot-navy">{participant.name}</span>
          <button type="button" className="ml-auto text-size-xs font-medium text-gray-500 underline underline-offset-[3px] cursor-pointer" onClick={onNoStrongImpression}>
            No strong impression
          </button>
        </div>
      )}
      desktopHeaderClassName="h-[73px] pt-0 pb-0 pl-6 pr-6 mb-0 border-b border-[#edeef2]"
      bottomDrawerOnMobile
      ariaLabel="Participant feedback"
      // TODO: disable clickaway (needs isDismissable prop on Modal)
    >
      <div className="w-full pt-6 max-w-[552px] -mx-2">
        <div className="w-[552px] max-w-full h-0" />

        <p className="flex items-center gap-1.5 text-[13px] leading-[1.3] text-gray-500 mb-6">
          <FaLock className="size-[13px] shrink-0" aria-hidden />
          Your responses are only seen by BlueDot staff
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <p id="show-up-label" className="text-size-xs font-semibold text-bluedot-navy">
              How did they show up across discussions?
            </p>
            <p className="text-size-xs text-gray-500">
              Think about preparation, initiative, and engagement between sessions.
            </p>
          </div>
          <RubricSelector
            name="show-up"
            ariaLabelledBy="show-up-label"
            options={SHOW_UP_OPTIONS}
            value={showUpRating}
            onChange={setShowUpRating}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <p id="engage-label" className="text-size-xs font-semibold text-bluedot-navy">
              How did they engage with ideas during discussions?
            </p>
            <p className="text-size-xs text-gray-500">
              Think about quality of thinking, willingness to challenge, and depth of engagement.
            </p>
          </div>
          <RubricSelector
            name="engage"
            ariaLabelledBy="engage-label"
            options={ENGAGE_OPTIONS}
            value={engageRating}
            onChange={setEngageRating}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="investment-note" className="text-size-xs font-semibold text-bluedot-navy">
              In 2-3 sentences: what would you tell BlueDot if we asked "how much time should we invest in this person?"
            </label>
            <p className="text-size-xs text-gray-500">Feel free to paste this from your 1:1 report.</p>
          </div>
          <textarea
            id="investment-note"
            value={investmentNote}
            onChange={(e) => setInvestmentNote(e.target.value)}
            className="w-full h-[106px] border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy bg-white resize-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal"
          />
          {hasTopScore && (
            <p className="flex gap-2 items-start bg-blue-50 text-bluedot-normal text-size-xs rounded-md p-3">
              <span className="shrink-0">ℹ</span>
              You've given a top score - a short note on what stood out helps us act on this.
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="font-medium">How should we follow up with them?</p>
          <p className="text-size-sm text-gray-500 mb-2">Check all that apply.</p>
          {FOLLOW_UP_OPTIONS.map((option) => (
            <label key={option.id} className="flex items-center gap-3 border rounded p-3 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!followUps[option.id]}
                onChange={(e) => setFollowUps({ ...followUps, [option.id]: e.target.checked })}
              />
              <span className="text-size-sm">{option.label}</span>
            </label>
          ))}
          {hasTopScore && (
            <p className="flex gap-2 items-start bg-blue-50 text-bluedot-normal text-size-sm rounded p-3 mt-2">
              <span className="shrink-0">ℹ</span>
              You've given a top score — let us know how to follow up.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-gray-200">
          <p className="text-size-xs text-gray-400">Changes save when you click "Done"</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="bg-bluedot-normal text-white px-4 py-2 rounded"
              onClick={() => {
                if (showUpRating !== null && engageRating !== null) {
                  onSave({
                    showUpRating, engageRating, investmentNote, followUps,
                  });
                }
              }}
              disabled={showUpRating === null || engageRating === null || isSaving}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
  ariaLabelledBy: string;
  options: RubricOption[];
  value: number | null;
  onChange: (value: number) => void;
};

export const RubricSelector: React.FC<RubricSelectorProps> = ({ name, ariaLabelledBy, options, value, onChange }) => {
  return (
    <div role="radiogroup" aria-labelledby={ariaLabelledBy}>
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
            <span className="font-medium text-size-sm w-6 text-center shrink-0">{option.value}</span>
            <div>
              <span className="text-size-sm">{option.label}</span>
              {isSelected && (
                <p className="text-size-sm text-gray-500 mt-1">{option.description}</p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
