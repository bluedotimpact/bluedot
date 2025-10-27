import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PiBriefcase, PiCompass, PiFlask } from 'react-icons/pi';
import WhoIsThisForSection from './WhoIsThisForSection';

const mockTargetAudiences = [
  {
    icon: PiBriefcase,
    boldText: 'For entrepreneurs and operators',
    description: 'who want to build solutions that protect humanity.',
  },
  {
    icon: PiCompass,
    boldText: 'For leaders',
    description: 'who want to steer AI\'s trajectory towards beneficial outcomes for humanity.',
  },
  {
    icon: PiFlask,
    boldText: 'For researchers',
    description: 'who want to take big bets on the most impactful research ideas.',
  },
];

describe('WhoIsThisForSection', () => {
  it('renders correctly', () => {
    const { container } = render(<WhoIsThisForSection targetAudiences={mockTargetAudiences} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<WhoIsThisForSection targetAudiences={mockTargetAudiences} />);
    expect(getByText('Who this course is for')).toBeDefined();
  });

  it('renders all three target audience cards', () => {
    const { getByText } = render(<WhoIsThisForSection targetAudiences={mockTargetAudiences} />);

    // Check all card titles are rendered
    expect(getByText('For entrepreneurs and operators')).toBeDefined();
    expect(getByText('For leaders')).toBeDefined();
    expect(getByText('For researchers')).toBeDefined();
  });

  it('renders target audience descriptions', () => {
    const { getByText } = render(<WhoIsThisForSection targetAudiences={mockTargetAudiences} />);

    // Check card descriptions - text is now in spans
    expect(getByText('who want to build solutions that protect humanity.')).toBeDefined();
    expect(getByText('who want to steer AI\'s trajectory towards beneficial outcomes for humanity.')).toBeDefined();
    expect(getByText('who want to take big bets on the most impactful research ideas.')).toBeDefined();
  });
});
