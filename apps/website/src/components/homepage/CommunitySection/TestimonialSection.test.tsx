import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import TestimonialSection from './TestimonialSubSection';

const testimonials = [
  {
    quote: 'I love this course!',
    name: 'John Doe',
    role: 'Software Engineer',
    imageSrc: '/images/graduates/adam.webp',
  },
  {
    quote: 'I love this course!',
    name: 'Jane Doe',
    role: 'Sr. Software Engineer',
    imageSrc: '/images/graduates/ana.webp',
  },
];

describe('TestimonialSection', () => {
  test('renders as expected', () => {
    const { container } = render(<TestimonialSection testimonials={testimonials} />);
    expect(container).toMatchSnapshot();
  });

  test('displays section title', () => {
    const title = 'What our graduates say';
    render(<TestimonialSection title={title} testimonials={testimonials} />);
    expect(screen.getByText(title)).toBeDefined();
  });
});
