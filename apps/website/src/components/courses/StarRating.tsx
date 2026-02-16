import { maybePlural } from '@bluedot/ui';
import type React from 'react';
import { useState } from 'react';

const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 39 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.4794 11.4922C24.7341 12.008 25.1966 12.3851 25.744 12.5352L25.9833 12.585L37.2802 14.2363L29.1073 22.1963C28.665 22.6271 28.4482 23.2364 28.5145 23.8457L28.5321 23.9678L30.4608 35.2119L20.3593 29.8994C19.813 29.6123 19.167 29.5944 18.6083 29.8457L18.4979 29.8994L8.39636 35.2119L10.3251 23.9678C10.4364 23.3187 10.2216 22.6558 9.74988 22.1963L1.57703 14.2363L12.8739 12.585C13.5243 12.4898 14.0867 12.0816 14.3778 11.4922L19.4286 1.25879L24.4794 11.4922Z"
      stroke="#FFAE36"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? '#FFC16A' : 'transparent'}
      style={{
        transition: 'fill 0.1s ease-in-out',
      }}
    />
  </svg>
);

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
            <Star filled={(hoverRating || rating) >= i} />
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
