import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import TestimonialSection from './TestimonialSection';

describe('TestimonialSection', () => {
  test('renders as expected', () => {
    const { container } = render(<TestimonialSection />);
    expect(container).toMatchSnapshot();
  });

  test('displays section title', () => {
    render(<TestimonialSection />);
    expect(screen.getByText(/What our graduates say/i)).toBeDefined();
  });
});
