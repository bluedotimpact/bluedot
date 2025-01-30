import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import TestimonialSection from './TestimonialSection';

describe('TestimonialSection', () => {
  test('renders as expected', () => {
    const { container } = render(<TestimonialSection />);
    expect(container).toMatchSnapshot();
  });

  test('displays correct number of testimonials', () => {
    const { getAllByRole } = render(<TestimonialSection />);
    const testimonialCards = getAllByRole('blockquote');
    expect(testimonialCards).toHaveLength(3);
  });
}); 