import { render, screen, fireEvent } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { sendGAEvent } from '@next/third-parties/google';
import { constants } from '@bluedot/ui';
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
    expect(screen.getByText('The Future of AI Course')).toBeDefined();
    // Verify the first of the other courses is present
    expect(screen.getByText('Economics of Transformative AI')).toBeDefined();
  });

  test('tracks clicks on course cards', () => {
    render(<CourseSection />);

    // Click the featured course card
    const featuredCard = screen.getByText('The Future of AI Course');
    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'The Future of AI Course',
      course_url: constants.COURSES[0]?.url,
    });

    // Click another course card
    const other = screen.getByText('AI Alignment');
    fireEvent.click(other);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'AI Alignment',
      course_url: 'https://aisafetyfundamentals.com/alignment/',
    });
  });
});
