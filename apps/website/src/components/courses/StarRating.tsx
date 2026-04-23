import { maybePlural } from '@bluedot/ui';
import type React from 'react';
import { useState } from 'react';
import { StarIcon } from '../icons/StarIcon';

type StarRatingProps = {
  rating: number;
  onChange: (rating: number) => void;
};

const TOOLTIP_TEXTS = [
  { line1: 'Struggled to understand', line2: 'key concepts' },
  { line1: 'Understood basics but', line2: 'found it challenging' },
  { line1: 'Learned adequately but', line2: 'had some difficulty' },
  { line1: 'Learned well and felt', line2: 'appropriately challenged' },
  { line1: 'Mastered concepts', line2: 'with confidence' },
];

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange }) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const getHoverText = (starNumber: number) => {
    const text = TOOLTIP_TEXTS[starNumber - 1];
    if (!text) {
      return null;
    }

    return (
      <div className="flex flex-col">
        <span>"{text.line1}</span>
        <span>{text.line2}"</span>
      </div>
    );
  };

  return (
    <div className="star-rating flex -mx-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="relative">
          <button
            type="button"
            className="star-rating__star cursor-pointer h-10 w-14 px-2 hover:scale-125 active:scale-110 transition-all"
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(i)}
            aria-label={`Rate ${maybePlural(i, 'star')}`}
            aria-pressed={(hoverRating || rating) >= i}
          >
            <StarIcon filled={(hoverRating || rating) >= i} />
          </button>
          {hoverRating === i && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-color-canvas-dark text-white text-size-sm rounded-lg z-10 pointer-events-none text-center whitespace-nowrap">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1">
                <div className="size-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-color-canvas-dark" />
              </div>
              {getHoverText(i)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StarRating;
