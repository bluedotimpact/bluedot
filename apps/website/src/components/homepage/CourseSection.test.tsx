import { sendGAEvent } from '@next/third-parties/google';
import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockCourse } from '../../__tests__/testUtils';
import CourseSection from './CourseSection';

// Mock GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

const mockCourses = [
  createMockCourse({
    id: 'course-agi',
    slug: 'agi-strategy',
    title: 'AGI Strategy',
    shortDescription: 'A deep dive into the incentives driving the AI companies, what\'s at stake, and the strategies for ensuring AI benefits humanity. You\'ll finish with your own action plan.',
    durationHours: 25,
    isFeatured: true,
  }),
  createMockCourse({
    id: 'course-bio',
    slug: 'biosecurity',
    title: 'Biosecurity',
    shortDescription: 'For people who want to build a pandemic-proof world. Learn how we can defend against AI-enabled bioattacks.',
    durationHours: 30,
    isFeatured: false,
  }),
  createMockCourse({
    id: 'course-tas',
    slug: 'technical-ai-safety',
    title: 'Technical AI Safety',
    shortDescription: 'For technical talent who want to drive AI safety research and policy professionals building governance solutions.',
    durationHours: 30,
    isFeatured: false,
  }),
  createMockCourse({
    id: 'course-gov',
    slug: 'ai-governance',
    title: 'Frontier AI Governance',
    shortDescription: 'Learn about the policy landscape, regulatory tools, and institutional reforms needed to navigate the transition to transformative AI.',
    durationHours: 25,
    isFeatured: false,
  }),
];

describe('CourseSection', () => {
  beforeEach(() => {
    server.use(trpcMsw.courses.getAll.query(() => mockCourses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
  });

  test('renders as expected', async () => {
    const { container } = render(<CourseSection />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.course-card--featured')).not.toBeNull();
    });

    expect(container).toMatchSnapshot();
  });

  test('tracks clicks on course cards', async () => {
    const { container } = render(<CourseSection />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.course-card--featured')).not.toBeNull();
    });

    // Click the featured course card using BEM class selector
    const featuredCard = container.querySelector('.course-card--featured')!;
    if (!featuredCard) {
      throw new Error('Featured course card not found');
    }

    fireEvent.click(featuredCard);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'AGI Strategy',
      course_url: '/courses/agi-strategy',
    });

    // Click another course card (first regular course card)
    const regularCards = container.querySelectorAll('.course-card--regular');
    if (!regularCards.length) {
      throw new Error('Regular course cards not found');
    }

    fireEvent.click(regularCards[0] as HTMLElement);

    // Verify GA event was sent with correct parameters
    expect(sendGAEvent).toHaveBeenCalledWith('event', 'course_card_click', {
      course_title: 'Biosecurity',
      course_url: '/courses/biosecurity',
    });
  });
});
