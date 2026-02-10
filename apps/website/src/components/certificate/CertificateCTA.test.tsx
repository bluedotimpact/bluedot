import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, expect, test,
} from 'vitest';
import { CertificateCTA } from './CertificateCTA';

describe('CertificateCTA', () => {
  const defaultProps = {
    courseName: 'AI Governance',
    courseSlug: 'ai-governance',
    courseUrl: 'https://bluedot.org/courses/ai-governance',
    gradient: 'linear-gradient(90deg, #1a2b3c 0%, #2a3b4c 100%)',
    accentColor: '#ff9900',
  };

  test('renders correctly with valid props', () => {
    const { container } = render(<CertificateCTA {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  test('displays the course name in the description text', () => {
    render(<CertificateCTA {...defaultProps} />);

    expect(screen.getByText(/Join thousands of professionals building expertise in ai governance/i)).toBeInTheDocument();
  });

  test('displays course name lowercased in description', () => {
    render(<CertificateCTA {...defaultProps} courseName="Technical AI Safety" />);

    expect(screen.getByText(/building expertise in technical ai safety/i)).toBeInTheDocument();
  });

  test('links to the correct course URL', () => {
    render(<CertificateCTA {...defaultProps} />);

    const ctaLink = screen.getByRole('link', { name: /Start for free/i });
    expect(ctaLink).toHaveAttribute('href', 'https://bluedot.org/courses/ai-governance');
  });

  test('displays default cohort text when nextCohortDate is not provided', () => {
    render(<CertificateCTA {...defaultProps} />);

    expect(screen.getByText('NEXT COHORT')).toBeInTheDocument();
  });

  test('displays custom cohort date when nextCohortDate is provided', () => {
    render(<CertificateCTA {...defaultProps} nextCohortDate="MARCH 2025" />);

    expect(screen.getByText('MARCH 2025')).toBeInTheDocument();
  });

  test('renders static heading and CTA text', () => {
    render(<CertificateCTA {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Your certificate');
    expect(heading).toHaveTextContent('awaits. Enroll today.');
    expect(screen.getByText('Start for free')).toBeInTheDocument();
  });
});
