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
  it('renders correctly with default colors', () => {
    const { container } = render(<ScheduleRounds {...mockProps} />, { wrapper: TrpcProvider });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders loading state initially', () => {
    const { container } = render(<ScheduleRounds {...mockProps} />, { wrapper: TrpcProvider });
    const loadingSkeletons = container.querySelectorAll('.animate-pulse');
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('renders with custom accent color (AGI Strategy purple)', () => {
    const { container } = render(
      <ScheduleRounds {...mockProps} accentColor="#9177dc" />,
      { wrapper: TrpcProvider },
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom accent color (Biosecurity green)', () => {
    const { container } = render(
      <ScheduleRounds {...mockProps} accentColor="#3da462" />,
      { wrapper: TrpcProvider },
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom accent color (Future of AI gold)', () => {
    const { container } = render(
      <ScheduleRounds {...mockProps} accentColor="#8c8146" />,
      { wrapper: TrpcProvider },
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom accent color (AI Governance blue)', () => {
    const { container } = render(
      <ScheduleRounds {...mockProps} accentColor="#4092d6" />,
      { wrapper: TrpcProvider },
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
