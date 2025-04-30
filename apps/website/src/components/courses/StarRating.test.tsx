// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import StarRating from './StarRating';

describe('StarRating Component', () => {
  test('renders correctly', () => {
    const setRating = vi.fn();
    const { getByLabelText, container } = render(<StarRating rating={0} onChange={setRating} />);

    const starButtons = [1, 2, 3, 4, 5].map((i) => getByLabelText(`Rate ${i} star${i > 1 ? 's' : ''}`));
    starButtons.forEach((button) => expect(button).toBeTruthy());

    expect(container).toMatchSnapshot();
  });

  test('selecting a rating works', () => {
    let rating = 0;
    const setRating = vi.fn((newRating) => {
      rating = newRating;
    });

    const { getByLabelText } = render(<StarRating rating={rating} onChange={setRating} />);

    const thirdStarButton = getByLabelText('Rate 3 stars');
    fireEvent.click(thirdStarButton);

    expect(setRating).toHaveBeenCalledWith(3);
    expect(rating).toBe(3);
  });
});
