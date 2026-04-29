import { maybePlural } from '@bluedot/ui';
import type React from 'react';
import { useState } from 'react';
import { StarIcon } from '../icons';

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
          <StarIcon filled={(hoverRating || rating) >= i} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
