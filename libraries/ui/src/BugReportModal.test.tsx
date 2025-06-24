import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { BugReportModal } from './BugReportModal';

describe('BugReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<BugReportModal />);
    // Button should be visible, but modal content should not
    expect(screen.getByText('Report an issue')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Your message')).not.toBeInTheDocument();
  });

  it('handles message submission successfully', async () => {
    const mockOnSubmit = vi.fn();
    const testMessage = 'Test bug report';

    render(<BugReportModal showTextarea onSubmit={mockOnSubmit} />);

    // Open modal by clicking the button
    fireEvent.click(screen.getByText('Report an issue'));

    const textarea = screen.getByPlaceholderText('Your message');
    fireEvent.change(textarea, { target: { value: testMessage } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(testMessage);
      // Modal should close after successful submission
      expect(screen.queryByPlaceholderText('Your message')).not.toBeInTheDocument();
    });
  });

  it('displays error view when submission fails', async () => {
    const testError = new Error('Failed to submit bug report');
    const mockOnSubmit = vi.fn().mockRejectedValue(testError);
    const testMessage = 'Test bug report';

    render(<BugReportModal showTextarea onSubmit={mockOnSubmit} />);

    // Open modal by clicking the button
    fireEvent.click(screen.getByText('Report an issue'));

    const textarea = screen.getByPlaceholderText('Your message');
    fireEvent.change(textarea, { target: { value: testMessage } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      // Look for the error message
      expect(screen.getByText(testError.message)).toBeInTheDocument();
      // Verify modal stays open and message is preserved
      expect(textarea).toHaveValue(testMessage);
      expect(screen.getByPlaceholderText('Your message')).toBeInTheDocument();
    });
  });

  it('renders social media links with default values', () => {
    render(<BugReportModal />);

    // Open modal by clicking the button
    fireEvent.click(screen.getByText('Report an issue'));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5); // GitHub text link + 4 social media icons

    // GitHub text link
    expect(links[0]).toHaveAttribute('href', 'https://github.com/bluedotimpact/bluedot/issues/new?template=bug.yaml');
    // Social media icons
    expect(links[1]).toHaveAttribute('href', 'mailto:team@bluedot.org');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/bluedotimpact');
    expect(links[3]).toHaveAttribute('href', 'https://x.com/BlueDotImpact');
    expect(links[4]).toHaveAttribute('href', 'https://www.linkedin.com/company/bluedotimpact/');
  });

  it('renders social media links with custom values', () => {
    const customLinks = {
      emailLink: 'mailto:custom@test.com',
      githubOrgLink: 'https://github.com/custom',
      githubLink: 'https://github.com/custom/repo/issues',
      twitterLink: 'https://x.com/custom',
      linkedinLink: 'https://linkedin.com/company/custom',
    };

    render(<BugReportModal {...customLinks} />);

    // Open modal by clicking the button
    fireEvent.click(screen.getByText('Report an issue'));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);

    // GitHub text link
    expect(links[0]).toHaveAttribute('href', customLinks.githubLink);
    // Social media icons
    expect(links[1]).toHaveAttribute('href', customLinks.emailLink);
    expect(links[2]).toHaveAttribute('href', customLinks.githubOrgLink);
    expect(links[3]).toHaveAttribute('href', customLinks.twitterLink);
    expect(links[4]).toHaveAttribute('href', customLinks.linkedinLink);
  });
});
