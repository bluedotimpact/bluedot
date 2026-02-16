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

  it('renders correctly when open', () => {
    render(<BugReportModal isOpen />);
    expect(screen.getByText('Submit feedback')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BugReportModal isOpen={false} />);
    expect(screen.queryByText('Submit feedback')).not.toBeInTheDocument();
  });

  it('handles message submission successfully', async () => {
    const mockOnSubmit = vi.fn();
    const mockSetIsOpen = vi.fn();
    const testMessage = 'Test bug report';

    render(<BugReportModal
      showTextarea
      onSubmit={mockOnSubmit}
      isOpen
      setIsOpen={mockSetIsOpen}
    />);

    const textarea = screen.getByPlaceholderText('Your message');
    fireEvent.change(textarea, { target: { value: testMessage } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(testMessage);
      expect(mockSetIsOpen).toHaveBeenCalledWith(false);
    });
  });

  it('displays error view when submission fails', async () => {
    const testError = new Error('Failed to submit bug report');
    const mockOnSubmit = vi.fn().mockRejectedValue(testError);
    const testMessage = 'Test bug report';

    render(<BugReportModal
      showTextarea
      onSubmit={mockOnSubmit}
      isOpen
    />);

    const textarea = screen.getByPlaceholderText('Your message');
    fireEvent.change(textarea, { target: { value: testMessage } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText(testError.message)).toBeInTheDocument();
      expect(textarea).toHaveValue(testMessage);
    });
  });

  it('renders social media links with default values', () => {
    render(<BugReportModal isOpen />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);

    expect(links[0]).toHaveAttribute('href', 'https://github.com/bluedotimpact/bluedot/issues/new?template=bug.yaml');
    expect(links[1]).toHaveAttribute('href', 'mailto:team@bluedot.org');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/bluedotimpact');
    expect(links[3]).toHaveAttribute('href', 'https://x.com/BlueDotImpact');
    expect(links[4]).toHaveAttribute('href', 'https://www.linkedin.com/company/bluedotimpact/');
  });
});
