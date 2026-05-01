import { ErrorSection, Modal } from '@bluedot/ui';
import { useState } from 'react';
import { FaCheck, FaCircleInfo, FaLock } from 'react-icons/fa6';
import { ACTIONABLE_FOLLOW_UP_IDS, FOLLOW_UP_OPTIONS, type FollowUpId } from '../../lib/facilitatorFollowUps';
import { getInitials } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

export type ParticipantFeedbackData = {
  showUpRating: number;
  engageRating: number;
  investmentNote: string;
  followUps: FollowUpId[];
};

type ParticipantFeedbackModalProps = {
  meetPersonId: string;
  participant: { id: string; name: string };
  initialData?: ParticipantFeedbackData;
  onClose: () => void;
  onSaved: (data: ParticipantFeedbackData) => void;
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

const ParticipantFeedbackModal: React.FC<ParticipantFeedbackModalProps> = ({ meetPersonId, participant, initialData, onClose, onSaved, onNoStrongImpression }) => {
  const [showUpRating, setShowUpRating] = useState<number | null>(initialData?.showUpRating ?? null);
  const [engageRating, setEngageRating] = useState<number | null>(initialData?.engageRating ?? null);
  const [investmentNote, setInvestmentNote] = useState(initialData?.investmentNote ?? '');
  const [followUps, setFollowUps] = useState<FollowUpId[]>(initialData?.followUps ?? []);
  const hasFollowUp = followUps.length > 0;
  const isStandout = showUpRating === 5 || engageRating === 5
    || ACTIONABLE_FOLLOW_UP_IDS.some((id) => followUps.includes(id));

  const savePeerFeedback = trpc.facilitators.savePeerFeedback.useMutation();

  const handleSave = () => {
    if (showUpRating === null || engageRating === null || !hasFollowUp) return;
    const data: ParticipantFeedbackData = {
      showUpRating, engageRating, investmentNote, followUps,
    };
    savePeerFeedback.mutate({
      meetPersonId,
      participantId: participant.id,
      initiativeRating: data.showUpRating,
      reasoningQualityRating: data.engageRating,
      feedback: data.investmentNote,
      nextSteps: data.followUps,
    }, { onSuccess: () => onSaved(data) });
  };

  return (
    <Modal
      isOpen
      setIsOpen={(v) => {
        // Block dismissal while a save is in flight to prevent duplicates
        if (!v && !savePeerFeedback.isPending) onClose();
      }}
      title={(
        <div className="flex-1 flex items-center gap-3 pr-3">
          <div className="size-10 rounded-full bg-bluedot-normal flex items-center justify-center text-white text-size-xs font-bold shrink-0">
            {getInitials(participant.name)}
          </div>
          <span className="font-bold text-size-md text-bluedot-navy">{participant.name}</span>
          <button
            type="button"
            onClick={onNoStrongImpression}
            disabled={savePeerFeedback.isPending}
            className="ml-auto text-size-xs font-medium text-bluedot-navy/50 underline underline-offset-[3px] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
          >
            No strong impression
          </button>
        </div>
      )}
      desktopHeaderClassName="h-[73px] py-0 px-6 mb-0 border-b border-gray-200"
      bottomDrawerOnMobile
      ariaLabel="Participant feedback"
      noClickaway
    >
      <div className="w-full max-w-[600px] pt-4">
        {savePeerFeedback.isError && <ErrorSection error={savePeerFeedback.error} />}
        <p className="flex items-center gap-1.5 text-size-xs leading-[1.3] text-bluedot-navy/60 mb-6">
          <FaLock className="size-[13px] shrink-0" aria-hidden />
          Your responses are only seen by BlueDot staff
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p id="show-up-label" className="text-size-xs font-semibold text-bluedot-navy">
              How did they show up across discussions? <span className="text-red-600">*</span>
            </p>
            <p className="text-size-xs text-bluedot-navy/60">
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

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p id="engage-label" className="text-size-xs font-semibold text-bluedot-navy">
              How did they engage with ideas during discussions? <span className="text-red-600">*</span>
            </p>
            <p className="text-size-xs text-bluedot-navy/60">
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

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-size-xs font-semibold text-bluedot-navy">
              How should we follow up with them? <span className="text-red-600">*</span>
            </p>
            <p className="text-size-xs text-bluedot-navy/60">Check all that apply.</p>
          </div>
          <div className="flex flex-col gap-2">
            {FOLLOW_UP_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2.5 border border-gray-300 rounded-md bg-white px-2.5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={followUps.includes(option.id)}
                  onChange={(e) => setFollowUps(e.target.checked
                    ? [...followUps, option.id]
                    : followUps.filter((id) => id !== option.id))}
                  className="size-[18px] shrink-0 cursor-pointer accent-bluedot-normal"
                />
                <span className="text-size-xs font-medium text-bluedot-navy">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="investment-note" className="text-size-xs font-semibold text-bluedot-navy">
              In 2-3 sentences: what would you tell BlueDot if we asked "how much time should we invest in this person?"
            </label>
            <p className="text-size-xs text-bluedot-navy/60">Feel free to paste this from your 1:1 report.</p>
          </div>
          <textarea
            id="investment-note"
            value={investmentNote}
            onChange={(e) => setInvestmentNote(e.target.value)}
            className="w-full h-[106px] border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy bg-white resize-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal"
          />
          {isStandout && <StandoutNudge />}
        </div>

        <div className="flex items-center justify-between gap-3 mt-8 py-4 border-t border-gray-200">
          <p className="text-size-xxs text-bluedot-navy/50">Changes save when you click "Done"</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={savePeerFeedback.isPending}
              className="bg-white border border-gray-300 rounded-md px-4 py-2.5 text-size-xs font-medium text-bluedot-navy transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-bluedot-normal text-white px-6 py-2.5 rounded-md text-size-xs leading-5 font-semibold transition-colors cursor-pointer hover:bg-bluedot-darker disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
              onClick={handleSave}
              disabled={showUpRating === null || engageRating === null || !hasFollowUp || savePeerFeedback.isPending}
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

const StandoutNudge: React.FC = () => (
  <div className="flex gap-2 items-start bg-[#e5edfe] border border-[#c4d3f8] rounded-md p-[11px]">
    <FaCircleInfo className="size-3.5 shrink-0 text-bluedot-normal mt-[3px]" aria-hidden />
    <p className="text-size-xs leading-[19.5px] text-bluedot-normal">
      Sounds like they are a standout – a short note here would help us act on this.
    </p>
  </div>
);

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

const BUBBLE_COLORS: Record<number, string> = {
  5: 'bg-[#d3f0e3] text-[#1a7a52]',
  4: 'bg-[#e2f5da] text-[#4a7a30]',
  3: 'bg-[#fffbe0] text-[#8a7020]',
  2: 'bg-[#ffe9d5] text-[#8a5020]',
  1: 'bg-[#ffe4e0] text-[#8a2020]',
};

export const RubricSelector: React.FC<RubricSelectorProps> = ({ name, ariaLabelledBy, options, value, onChange }) => {
  return (
    <div role="radiogroup" aria-labelledby={ariaLabelledBy} className="rounded-md border-[0.5px] border-[rgba(106,111,122,0.5)] overflow-clip">
      {options.map((option, idx) => {
        const isSelected = value === option.value;
        const isLast = idx === options.length - 1;
        return (
          <label
            key={option.value}
            className={`flex items-start cursor-pointer ${isLast ? '' : 'border-b border-[#edeef2]'} has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-bluedot-normal ${isSelected ? 'bg-[#e5edfe]' : 'bg-white'}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className={`w-11 self-stretch shrink-0 flex items-start justify-center pt-3 text-size-sm leading-[22.5px] font-bold border-r ${isSelected ? 'bg-[#c4d3f8] text-[#0d3399] border-[#c4d3f8]' : `${BUBBLE_COLORS[option.value]} opacity-[0.56] border-[rgba(0,0,0,0.06)]`}`}>
              {option.value}
            </div>
            <div className="flex-1 min-w-0 px-3 pt-3 pb-5">
              <p className="text-size-xs leading-[20px] text-bluedot-navy">{option.label}</p>
              {isSelected && (
                <p className="text-size-xxs leading-[20px] text-bluedot-navy mt-1.5">{option.description}</p>
              )}
            </div>
            {isSelected && (
              <div className="w-[30px] shrink-0 flex justify-center pt-3">
                <FaCheck className="size-3.5 text-bluedot-normal" aria-hidden />
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
};
