import { type RatingValue } from '../lib/client/types';

type RatingButtonsProps = {
  onRate: (rating: RatingValue) => void;
  disabled?: boolean;
};

export const RatingButtons: React.FC<RatingButtonsProps> = ({ onRate, disabled }) => (
  <div className="flex gap-2 sm:gap-3">
    {/* No */}
    <button
      type="button"
      disabled={disabled}
      onClick={() => onRate('no')}
      className="flex-1 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-red-800 text-red-400 hover:bg-red-950 active:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      ← No
    </button>

    {/* Neutral — split top/bottom */}
    <div className="flex-1 flex flex-col rounded-lg border-2 border-stone-600 overflow-hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate('neutral-accept')}
        className="flex-1 py-1.5 sm:py-2.5 text-size-sm font-semibold text-stone-300 hover:bg-stone-800 active:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ↑ Neutral Accept
      </button>
      <div className="border-t border-dashed border-stone-600" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate('neutral-reject')}
        className="flex-1 py-1.5 sm:py-2.5 text-size-sm font-semibold text-stone-300 hover:bg-stone-800 active:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ↓ Neutral Reject
      </button>
    </div>

    {/* Yes */}
    <button
      type="button"
      disabled={disabled}
      onClick={() => onRate('yes')}
      className="flex-1 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-green-700 text-green-400 hover:bg-green-950 active:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Yes →
    </button>

    {/* Strong Yes */}
    <button
      type="button"
      disabled={disabled}
      onClick={() => onRate('strong-yes')}
      className="px-3 sm:px-4 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-green-500 text-green-300 bg-green-950 hover:bg-green-900 active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      🔥
    </button>
  </div>
);
