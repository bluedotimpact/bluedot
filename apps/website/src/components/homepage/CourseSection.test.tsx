import { sendGAEvent } from '@next/third-parties/google';
import { fireEvent, render } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import CourseSection from './CourseSection';

// Mock GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

describe('CourseSection', () => {
  beforeEach(() => {
    // Mock tRPC endpoints with empty data
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
  });

  test('renders as expected', () => {
    const { container } = render(<CourseSection />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });

  test('tracks clicks on course cards', () => {
    const { container } = render(<CourseSection />, { wrapper: TrpcProvider });

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
