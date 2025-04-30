import { maybePlural } from '@bluedot/ui';
import React, { useState } from 'react';

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

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange }) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  return (
    <div className="star-rating flex -mx-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
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
      ))}
    </div>
  );
};

export default StarRating;
