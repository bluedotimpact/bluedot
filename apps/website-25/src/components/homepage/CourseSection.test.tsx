import { render, screen, fireEvent } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { sendGAEvent } from '@next/third-parties/google';
import { constants } from '@bluedot/ui';
import CourseSection from './CourseSection';

const EVENT_NAME = 'course_card_click' as const;
const featuredCourse = constants.COURSES.find((course) => course.isFeatured)!;
const nonFeaturedCourses = constants.COURSES.filter((course) => course !== featuredCourse);
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
    expect(screen.getByText(featuredCourse.title)).toBeDefined();
    // Verify one of the other courses is present
    expect(screen.getByText(nonFeaturedCourses[0]!.title)).toBeDefined();
  });

  test('tracks clicks on course cards', () => {
    render(<CourseSection />);

    // Click the featured course card
    const featuredCard = screen.getByText(featuredCourse.title);
    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', EVENT_NAME, {
      course_title: featuredCourse.title,
      course_url: featuredCourse.url,
    });

    // Click another course card
    const other = screen.getByText(nonFeaturedCourses[0]!.title);
    fireEvent.click(other);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', EVENT_NAME, {
      course_title: nonFeaturedCourses[0]!.title,
      course_url: nonFeaturedCourses[0]!.url,
    });
  });
});
