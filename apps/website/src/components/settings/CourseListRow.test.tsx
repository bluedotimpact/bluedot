/* eslint-disable import/no-extraneous-dependencies */
import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { mockCourse as createMockCourse } from '../../__tests__/testUtils';
import CourseListRow from './CourseListRow';

type MockCourseDetailsProps = {
  course: { title: string };
};

// Mock the CourseDetails component to avoid testing it here
vi.mock('./CourseDetails', () => ({
  default: ({ course }: MockCourseDetailsProps) => (
    <div aria-label={`Expanded details for ${course.title}`}>Course Details Content</div>
  ),
}));

describe('CourseListRow', () => {
  const mockCourse = createMockCourse({
    id: 'course-1',
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety and alignment.',
    durationDescription: '8 weeks',
    image: '/course-image.jpg',
    path: '/courses/ai-safety',
    slug: 'ai-safety',
    cadence: 'Weekly',
    level: 'Beginner',
  });

  const mockCourseRegistration = {
    id: 'reg-1',
    courseId: 'course-1',
    certificateCreatedAt: null,
    certificateId: null,
    email: 'test@example.com',
    userId: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    courseApplicationsBaseId: null,
    decision: null,
    role: null,
    lastVisitedUnitNumber: null,
    lastVisitedCourseContentPath: null,
    lastVisitAt: null,
    lastVisitedChunkIndex: null,
    roundStatus: 'Active',
  };

  it('renders in-progress course correctly (snapshot)', () => {
    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders completed course correctly (snapshot)', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      certificateCreatedAt: 1704067200, // Jan 1, 2024
      certificateId: 'cert-123',
    };

    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('shows expand button for in-progress course', () => {
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
      />,
    );

    // Check for expand button instead of continue link
    const expandButtons = screen.getAllByLabelText('Expand Introduction to AI Safety details');
    expect(expandButtons.length).toBeGreaterThan(0);
    expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'false');

    // The component renders the title (multiple times for responsive design)
    const titleElements = screen.getAllByText('Introduction to AI Safety');
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it('shows view certificate link for completed course', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      certificateCreatedAt: 1704067200, // Jan 1, 2024
      certificateId: 'cert-123',
    };

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
      />,
    );

    const certificateLinks = screen.getAllByRole('link', { name: 'View your certificate' });
    expect(certificateLinks[0]).toBeInTheDocument();
    const completedTexts = screen.getAllByText(/Completed on/);
    expect(completedTexts.length).toBeGreaterThan(0);
  });

  it('expands and collapses course details', async () => {
    const user = userEvent.setup();
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
      />,
    );

    const expandButtons = screen.getAllByLabelText('Expand Introduction to AI Safety details');
    const expandButton = expandButtons[0]!;
    expect(screen.queryByLabelText('Expanded details for Introduction to AI Safety')).not.toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.getByLabelText('Expanded details for Introduction to AI Safety')).toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(expandButton).toHaveAttribute('aria-label', 'Collapse Introduction to AI Safety details');

    await user.click(expandButton);
    expect(screen.queryByLabelText('Expanded details for Introduction to AI Safety')).not.toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });
});
