import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import TestimonialSection from './TestimonialSection';

describe('TestimonialSection', () => {
  test('renders as expected', () => {
    const { container } = render(<TestimonialSection />);
    expect(container).toMatchSnapshot();
  });

  test('displays testimonials not in a slide list', () => {
    render(<TestimonialSection />);

    // Check for testimonial content
    const testimonials = screen.getAllByRole('blockquote');
    expect(testimonials).toHaveLength(3);

    // Verify slide navigation does not exist
    expect(screen.queryByLabelText('Previous slide')).toBeNull();
    expect(screen.queryByLabelText('Next slide')).toBeNull();
  });

  test('displays section title', () => {
    render(<TestimonialSection />);
    expect(screen.getByText(/What our graduates say/i)).toBeDefined();
  });
});
