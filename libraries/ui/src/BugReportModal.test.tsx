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
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BugReportModal isOpen={false} />);
    expect(screen.queryByText('Submit feedback')).not.toBeInTheDocument();
  });

  it('shows success state after submission', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<BugReportModal isOpen onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Something is broken' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Something is broken',
        email: undefined,
        attachments: [],
      });
      expect(screen.getByText('Thank you')).toBeInTheDocument();
      expect(screen.getByText(/Your feedback has been sent/)).toBeInTheDocument();
    });
  });

  it('includes email in submission data', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<BugReportModal isOpen onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Feedback' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
      );
    });
  });

  it('displays error when submission fails', async () => {
    const testError = new Error('Network error');
    const mockOnSubmit = vi.fn().mockRejectedValue(testError);

    render(<BugReportModal isOpen onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  it('captures dropped files as attachments', async () => {
    render(<BugReportModal isOpen />);

    const file = new File(['screenshot'], 'screen.png', { type: 'image/png' });
    const dropTarget = screen.getByLabelText('Description').closest('div')!;

    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByAltText('screen.png')).toBeInTheDocument();
    });
  });

  it('captures pasted files as attachments', async () => {
    render(<BugReportModal isOpen />);

    const file = new File(['image'], 'pasted.png', { type: 'image/png' });
    const textarea = screen.getByLabelText('Description');

    fireEvent.paste(textarea, {
      clipboardData: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByAltText('pasted.png')).toBeInTheDocument();
    });
  });

  it('removes an attachment when the remove button is clicked', async () => {
    render(<BugReportModal isOpen />);

    const file = new File(['image'], 'removeme.png', { type: 'image/png' });
    const dropTarget = screen.getByLabelText('Description').closest('div')!;

    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByAltText('removeme.png')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Remove removeme.png'));

    await waitFor(() => {
      expect(screen.queryByAltText('removeme.png')).not.toBeInTheDocument();
    });
  });

  it('disables Submit when Description is empty', () => {
    render(<BugReportModal isOpen />);
    expect(screen.getByText('Submit').closest('button')).toBeDisabled();
  });
});
