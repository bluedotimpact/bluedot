import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  PiGraduationCap,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';
import CourseInformationSection from './CourseInformationSection';
import { TrpcProvider } from '../../../__tests__/trpcProvider';

const mockProps = {
  title: 'Course information',
  applicationUrl: 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX',
  courseSlug: 'agi-strategy',
  scheduleCtaText: 'Apply now',
  details: [
    {
      icon: PiGraduationCap,
      label: 'Options',
      description: (
        <>
          <span className="font-semibold">Intensive</span>: 6-day course (5h/day)
          <br />
          <span className="font-semibold">Part-time</span>: 6-week course (5h/week)
        </>
      ),
    },
    {
      icon: PiClockClockwise,
      label: 'Commitment',
      description: (
        <>
          Each day or week, you will:
          <br />
          <span className="font-semibold">Complete 2-3 hours</span> of reading and writing, and <span className="font-semibold">join ~8 peers in a 2-hour Zoom meeting</span> to discuss the content.
        </>
      ),
    },
    {
      icon: PiChats,
      label: 'Facilitator',
      description: 'All discussions will be facilitated by an AI safety expert.',
    },
    {
      icon: PiHandHeart,
      label: 'Price',
      description: 'This course is freely available and operates on a "pay-what-you-want" model.',
    },
    {
      icon: PiCalendarDots,
      label: 'Schedule',
      description: null,
      isSchedule: true,
      scheduleDescription: (
        <>
          New cohorts start every month:
          <br />
          Next round <span className="font-semibold">27th Oct</span>, application deadline <span className="font-semibold">19th Oct</span>
        </>
      ),
    },
  ],
};

describe('CourseInformationSection', () => {
  it('renders correctly with default colors', () => {
    const { container } = render(<CourseInformationSection {...mockProps} />, { wrapper: TrpcProvider });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<CourseInformationSection {...mockProps} />, { wrapper: TrpcProvider });
    expect(getByText('Course information')).toBeDefined();
  });

  it('renders all course detail cards', () => {
    const { getByText } = render(<CourseInformationSection {...mockProps} />, { wrapper: TrpcProvider });

    // Check that all expected card titles are present
    expect(getByText('Options')).toBeDefined();
    expect(getByText('Commitment')).toBeDefined();
    expect(getByText('Facilitator')).toBeDefined();
    expect(getByText('Price')).toBeDefined();
    expect(getByText('Schedule')).toBeDefined();
  });

  it('renders the schedule section', () => {
    const { getByText } = render(<CourseInformationSection {...mockProps} />, { wrapper: TrpcProvider });
    // The schedule section should be present
    expect(getByText('Schedule')).toBeDefined();
  });

  it('displays course detail descriptions', () => {
    const { getByText } = render(<CourseInformationSection {...mockProps} />, { wrapper: TrpcProvider });

    expect(getByText('Intensive')).toBeDefined();
    expect(getByText('Part-time')).toBeDefined();
    expect(getByText('Complete 2-3 hours')).toBeDefined();
    expect(getByText('join ~8 peers in a 2-hour Zoom meeting')).toBeDefined();
    expect(getByText(/facilitated by an AI safety expert/)).toBeDefined();
    expect(getByText(/pay-what-you-want/)).toBeDefined();
  });
});
