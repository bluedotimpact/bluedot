import { render, screen, fireEvent } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { sendGAEvent } from '@next/third-parties/google';
import CourseSection from './CourseSection';
// Mock the GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

describe('CourseSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders as expected', () => {
    const { container } = render(<CourseSection />);
    expect(container).toMatchSnapshot();

    // Verify featured course is present
    expect(screen.getByText('AI Safety: Intro to Transformative AI')).toBeDefined();

    // Verify navigation is present in header
    // TODO Make this check the desktop vs mobile behaviour
    const header = container.querySelector('.slide-list__nav--header');
    expect(header?.querySelector('[aria-label="Previous slide"]')).toBeDefined();
  });

  test('tracks clicks on course cards', () => {
    render(<CourseSection />);

    // Click the featured course card
    const featuredCard = screen.getByText('AI Safety: Intro to Transformative AI');
    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'AI Safety: Intro to Transformative AI',
      course_url: 'https://aisafetyfundamentals.com/intro-to-tai/',
    });

    // Click another course card
    const other = screen.getByText('Alignment Fast-Track');
    fireEvent.click(other);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'Alignment Fast-Track',
      course_url: 'https://aisafetyfundamentals.com/alignment-fast-track/',
    });
  });
});
