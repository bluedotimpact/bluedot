import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PiRocketLaunch, PiUsersThree, PiHandCoins } from 'react-icons/pi';
import CourseBenefitsSection from './CourseBenefitsSection';

const mockProps = {
  title: 'How this course will benefit you',
  benefits: [
    {
      icon: PiRocketLaunch,
      title: 'Take action in less than 30 hours',
      description: "You don't need another degree. This AGI Strategy course replaces years of self-study with three frameworks.",
    },
    {
      icon: PiUsersThree,
      title: 'Join a network of builders',
      description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions.",
    },
    {
      icon: PiHandCoins,
      title: 'Get funded to accelerate your impact',
      description: "If your final course proposal is strong, you'll receive $10-50k to kickstart your transition into impactful work.",
    },
  ],
};

describe('CourseBenefitsSection', () => {
  it('renders correctly with default colors', () => {
    const { container } = render(<CourseBenefitsSection {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders all three value cards', () => {
    const { getByText } = render(<CourseBenefitsSection {...mockProps} />);

    // Check all card titles are rendered
    expect(getByText('Join a network of builders')).toBeDefined();
    expect(getByText('Take action in less than 30 hours')).toBeDefined();
    expect(getByText('Get funded to accelerate your impact')).toBeDefined();
  });

  it('renders value card descriptions', () => {
    const { getByText } = render(<CourseBenefitsSection {...mockProps} />);

    // Check first card description
    expect(getByText(/This course isn.t for everyone/)).toBeDefined();

    // Check second card description
    expect(getByText(/You don.t need another degree/)).toBeDefined();

    // Check third card description
    expect(getByText(/If your final course proposal is strong/)).toBeDefined();
  });

  it('renders with custom icon background color (AGI Strategy purple)', () => {
    const { container } = render(
      <CourseBenefitsSection {...mockProps} iconBackgroundColor="#f3e8ff" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom icon background color (Biosecurity green)', () => {
    const { container } = render(
      <CourseBenefitsSection {...mockProps} iconBackgroundColor="#e5faea" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom icon background color (Future of AI cream)', () => {
    const { container } = render(
      <CourseBenefitsSection {...mockProps} iconBackgroundColor="#faf6e1" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom icon background color (AI Governance blue)', () => {
    const { container } = render(
      <CourseBenefitsSection {...mockProps} iconBackgroundColor="#ddf4ff" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('applies custom icon background color to icon containers', () => {
    const customBgColor = '#e5faea';
    const { container } = render(
      <CourseBenefitsSection {...mockProps} iconBackgroundColor={customBgColor} />,
    );
    const iconContainers = container.querySelectorAll(`[style*="background-color: ${customBgColor}"]`);
    expect(iconContainers.length).toBe(mockProps.benefits.length);
  });
});
