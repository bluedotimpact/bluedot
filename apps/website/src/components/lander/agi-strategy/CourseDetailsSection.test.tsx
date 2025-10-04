import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CourseDetailsSection from './CourseDetailsSection';

describe('CourseDetailsSection', () => {
  it('renders correctly', () => {
    const { container } = render(<CourseDetailsSection />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<CourseDetailsSection />);
    expect(getByText('Course information')).toBeDefined();
  });

  it('renders all course detail cards', () => {
    const { getByText } = render(<CourseDetailsSection />);

    // Check that all expected card titles are present
    expect(getByText('Options')).toBeDefined();
    expect(getByText('Commitment')).toBeDefined();
    expect(getByText('Facilitator')).toBeDefined();
    expect(getByText('Price')).toBeDefined();
    expect(getByText('Schedule')).toBeDefined();
  });

  it('renders the apply now button', () => {
    const { getByText } = render(<CourseDetailsSection />);
    expect(getByText('Apply now')).toBeDefined();
  });

  it('displays course detail descriptions', () => {
    const { getByText } = render(<CourseDetailsSection />);

    expect(getByText('Intensive')).toBeDefined();
    expect(getByText('Part-time')).toBeDefined();
    expect(getByText('Complete 2-3 hours')).toBeDefined();
    expect(getByText('join ~8 peers in a 2-hour Zoom meeting')).toBeDefined();
    expect(getByText(/facilitated by an AI safety expert/)).toBeDefined();
    expect(getByText(/pay-what-you-want/)).toBeDefined();
  });
});
