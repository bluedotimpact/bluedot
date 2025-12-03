import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScheduleRounds } from './ScheduleRounds';
import { TrpcProvider } from '../../../__tests__/trpcProvider';

const mockProps = {
  courseSlug: 'agi-strategy',
  applicationUrl: 'https://example.com/apply',
  fallbackContent: <div>Check above for upcoming rounds.</div>,
};

describe('ScheduleRounds', () => {
  it('renders correctly', () => {
    const { container } = render(<ScheduleRounds {...mockProps} />, { wrapper: TrpcProvider });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders loading state initially', () => {
    const { container } = render(<ScheduleRounds {...mockProps} />, { wrapper: TrpcProvider });
    const loadingSkeletons = container.querySelectorAll('.animate-pulse');
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });
});
