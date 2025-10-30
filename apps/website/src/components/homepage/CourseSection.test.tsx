import { render, fireEvent } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import useAxios from 'axios-hooks';
import { sendGAEvent } from '@next/third-parties/google';
import type { GetCoursesResponse } from '../../pages/api/courses';
import CourseSection from './CourseSection';
import { mockCourse } from '../../__tests__/testUtils';

type UseAxiosResult = ReturnType<typeof useAxios<GetCoursesResponse>>;

// Mock axios-hooks
vi.mock('axios-hooks', () => ({
  default: () => [{
    data: {
      type: 'success',
      courses: [
        mockCourse({
          id: '1',
          title: 'Featured Course',
          description: 'Featured course description',
          path: '/courses/future-of-ai',
          image: '/images/courses/featured.jpg',
          durationDescription: '4 weeks',
          cadence: 'Weekly',
          isFeatured: true,
          isNew: false,
        }),
        mockCourse({
          id: '2',
          title: 'New Course',
          description: 'New course description',
          path: '/courses/ops',
          image: '/images/courses/new.jpg',
          durationDescription: '2 weeks',
          cadence: 'Daily',
          isFeatured: false,
          isNew: true,
        }),
        mockCourse({
          id: '3',
          title: 'Another Course',
          description: 'Another course description',
          path: '/courses/another',
          image: '/images/courses/another.jpg',
          durationDescription: '3 weeks',
          cadence: 'MOOC',
        }),
      ],
    },
    loading: false,
    error: null,
  }, null!, null!] as UseAxiosResult,
}));

// Mock GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

describe('CourseSection', () => {
  test('renders as expected', () => {
    const { container } = render(<CourseSection />);
    expect(container).toMatchSnapshot();
  });

  test('tracks clicks on course cards', () => {
    const { container } = render(<CourseSection />);

    // Click the featured course card using BEM class selector
    const featuredCard = container.querySelector('.course-card--featured') as HTMLElement;
    if (!featuredCard) throw new Error('Featured course card not found');
    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'The Future of AI',
      course_url: '/courses/future-of-ai',
    });

    // Click another course card (first regular course card)
    const regularCards = container.querySelectorAll('.course-card--regular');
    if (!regularCards.length) throw new Error('Regular course cards not found');
    fireEvent.click(regularCards[0] as HTMLElement);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'AGI Strategy',
      course_url: '/courses/agi-strategy',
    });
  });
});
