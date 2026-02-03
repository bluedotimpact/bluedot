import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import {
  describe, expect, test,
} from 'vitest';
import { CertificateCard } from './CertificateCard';

const defaultProps = {
  courseName: 'Test Course',
  courseSlug: 'test-course',
  recipientName: 'John Doe',
  description: 'Successfully completed the <strong>Test Course</strong> program.',
  issuedDate: 'January 15, 2025',
  certificateId: 'cert-123-abc',
};

describe('CertificateCard', () => {
  describe('Rendering', () => {
    test('renders correctly with valid props', () => {
      const { container } = render(<CertificateCard {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    test('displays course name in heading', () => {
      render(<CertificateCard {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Test Course');
    });

    test('displays recipient name', () => {
      render(<CertificateCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('displays description with HTML content', () => {
      render(<CertificateCard {...defaultProps} />);
      const descriptionElement = screen.getByText(/Successfully completed the/);
      expect(descriptionElement).toBeInTheDocument();
      expect(within(descriptionElement).getByText('Test Course')).toBeInTheDocument();
    });

    test('displays issued date', () => {
      render(<CertificateCard {...defaultProps} />);
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
    });

    test('displays certificate ID', () => {
      render(<CertificateCard {...defaultProps} />);
      expect(screen.getByText('cert-123-abc')).toBeInTheDocument();
    });

    test('displays static labels', () => {
      render(<CertificateCard {...defaultProps} />);
      expect(screen.getByText('Professional certification')).toBeInTheDocument();
      expect(screen.getByText('Awarded to')).toBeInTheDocument();
      expect(screen.getByText('Issued')).toBeInTheDocument();
      expect(screen.getByText('Certificate ID')).toBeInTheDocument();
    });
  });
});
