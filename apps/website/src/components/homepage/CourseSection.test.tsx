import { sendGAEvent } from '@next/third-parties/google';
import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { mockCourse } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import CourseSection from './CourseSection';

const mockCourses = [
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
    displayOnCourseHubIndex: true,
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
    displayOnCourseHubIndex: true,
  }),
  mockCourse({
    id: '3',
    title: 'Another Course',
    description: 'Another course description',
    path: '/courses/another',
    image: '/images/courses/another.jpg',
    durationDescription: '3 weeks',
    cadence: 'MOOC',
    displayOnCourseHubIndex: true,
  }),
];

// Mock GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

describe('CourseSection', () => {
  test('renders as expected', async () => {
    server.use(trpcMsw.courses.getAll.query(() => mockCourses));

    const { container } = render(<CourseSection />, { wrapper: TrpcProvider });

    // Wait for the courses to load
    await waitFor(() => {
      expect(screen.getByText('Featured Course')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  test('tracks clicks on course cards', async () => {
    server.use(trpcMsw.courses.getAll.query(() => mockCourses));

    render(<CourseSection />, { wrapper: TrpcProvider });

    // Wait for the courses to load
    await waitFor(() => {
      expect(screen.getByText('Featured Course')).toBeInTheDocument();
    });

    // Click the featured course card by finding the link
    const featuredCard = screen.getByRole('link', { name: /Featured Course/i });
    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'Featured Course',
      course_url: '/courses/future-of-ai',
    });

    // Click another course card (first non-featured course card)
    const newCourseCard = screen.getByRole('link', { name: /New Course/i });
    fireEvent.click(newCourseCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'New Course',
      course_url: '/courses/ops',
    });
  });
});
