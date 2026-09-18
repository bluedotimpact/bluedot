import { type RatingValue } from '../lib/client/types';

type RatingButtonsProps = {
  onRate: (rating: RatingValue) => void;
  disabled?: boolean;
};

export const RatingButtons: React.FC<RatingButtonsProps> = ({ onRate, disabled }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
    {/* No */}
    <button
      type="button"
      style={{ minHeight: 44 }}
      disabled={disabled}
      onClick={() => onRate('no')}
      className="flex-1 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-error-border text-error-fg hover:bg-error-bg active:bg-error-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      ← No
    </button>

    {/* Neutral — split top/bottom */}
    <div className="flex-1 flex flex-col rounded-lg border-2 border-strong overflow-hidden">
      <button
        type="button"
        style={{ minHeight: 44 }}
        disabled={disabled}
        onClick={() => onRate('neutral-accept')}
        className="flex-1 py-1.5 sm:py-2.5 text-size-sm font-semibold text-primary hover:bg-tint active:bg-active disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ↑ Neutral Accept
      </button>
      <div className="border-t border-dashed border-strong" />
      <button
        type="button"
        style={{ minHeight: 44 }}
        disabled={disabled}
        onClick={() => onRate('neutral-reject')}
        className="flex-1 py-1.5 sm:py-2.5 text-size-sm font-semibold text-primary hover:bg-tint active:bg-active disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ↓ Neutral Reject
      </button>
    </div>

    {/* Yes */}
    <button
      type="button"
      style={{ minHeight: 44 }}
      disabled={disabled}
      onClick={() => onRate('yes')}
      className="flex-1 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-info-border text-info-fg hover:bg-info-bg active:bg-info-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Yes →
    </button>

    {/* Strong Yes */}
    <button
      type="button"
      style={{ minHeight: 44 }}
      disabled={disabled}
      onClick={() => onRate('strong-yes')}
      aria-label="Strong yes"
      className="px-3 sm:px-4 py-2.5 sm:py-4 rounded-lg font-semibold text-size-sm border-2 border-accent text-info-fg bg-info-bg hover:bg-info-bg active:bg-info-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Strong yes
    </button>
  </div>
);
