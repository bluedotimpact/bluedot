import {
  render, waitFor, fireEvent, getByRole, getByText,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import { useRouter } from 'next/router';
import FreeTextResponse from './FreeTextResponse';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock axios
vi.mock('axios');
// Setup axios mock to resolve successfully
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockRouter = {
  asPath: '/test-path',
};

// Setup router mock before each test
beforeEach(() => {
  (useRouter as Mock).mockReturnValue(mockRouter);
});

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  exerciseId: 'rec1234567890',
  onExerciseSubmit: vi.fn(),
};

describe('FreeTextResponse', () => {
  test('renders default as expected', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('#save-status-message')).toBeFalsy();
  });

  test('renders logged in as expected', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} isLoggedIn />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('#save-status-message')).toBeFalsy();
  });

  test('renders with saved exercise response', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} exerciseResponse="This is my saved answer." isLoggedIn />,
    );

    const textareaEl = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(container).toMatchSnapshot();
    expect(textareaEl.value).toBe('This is my saved answer.');
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset axios mock to resolve successfully by default
      (axios.put as Mock).mockResolvedValue({ data: {} });
    });

    test('shows typing status when user types in textarea', async () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Wait for status to update
      await waitFor(() => {
        const statusMessage = getByText(container, 'Click outside to save your answer');
        expect(statusMessage).toBeTruthy();
      });
    });

    test('triggers auto-save when user clicks outside after typing', async () => {
      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Wait for typing status
      await waitFor(() => {
        expect(getByText(container, 'Click outside to save your answer')).toBeTruthy();
      });

      // Trigger blur event (clicking outside)
      fireEvent.blur(textarea);

      // Check that saving status appears
      await waitFor(() => {
        expect(getByText(container, 'Saving answer...')).toBeTruthy();
      });

      // Check that onExerciseSubmit was called
      expect(mockOnExerciseSubmit).toHaveBeenCalledWith('This is my answer', true);

      // Wait for save to complete and show success
      await waitFor(() => {
        expect(getByText(container, 'Answer saved')).toBeTruthy();
      }, { timeout: 1000 });
    });

    test('does not auto-save when user is not logged in', async () => {
      const mockOnExerciseSubmit = vi.fn();
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn={false} />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Trigger blur event
      fireEvent.blur(textarea);

      // Should not call onExerciseSubmit
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      // Should not show any save status (save status indicator only shows when logged in)
      expect(container.querySelector('#save-status-message')).toBeFalsy();
    });

    test('does not auto-save when content has not changed', async () => {
      const mockOnExerciseSubmit = vi.fn();
      const { container } = render(
        <FreeTextResponse
          {...mockArgs}
          onExerciseSubmit={mockOnExerciseSubmit}
          exerciseResponse="Existing answer"
          isLoggedIn
        />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Trigger blur without changing content
      fireEvent.blur(textarea);

      // Should not call onExerciseSubmit
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();
    });

    test('shows error status when save fails', async () => {
      const mockOnExerciseSubmit = vi.fn().mockRejectedValue(new Error('Save failed'));
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Trigger blur event
      fireEvent.blur(textarea);

      // Wait for saving status
      await waitFor(() => {
        expect(getByText(container, 'Saving answer...')).toBeTruthy();
      });

      // Wait for error status to appear
      await waitFor(() => {
        expect(getByText(container, "Couldn't save answer.")).toBeTruthy();
        expect(getByRole(container, 'button', { name: /retry/i })).toBeTruthy();
      }, { timeout: 1000 });

      expect(mockOnExerciseSubmit).toHaveBeenCalledWith('This is my answer', true);
    });

    test('retry functionality works when save fails', async () => {
      const mockOnExerciseSubmit = vi.fn()
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({});

      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Trigger blur event
      fireEvent.blur(textarea);

      // Wait for error status to appear
      await waitFor(() => {
        expect(getByText(container, "Couldn't save answer.")).toBeTruthy();
      }, { timeout: 1000 });

      // Click retry button
      const retryButton = getByRole(container, 'button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should show saving status again
      await waitFor(() => {
        expect(getByText(container, 'Saving answer...')).toBeTruthy();
      });

      // Should eventually show success
      await waitFor(() => {
        expect(getByText(container, 'Answer saved')).toBeTruthy();
      }, { timeout: 1000 });

      // Should have been called twice (initial attempt + retry)
      expect(mockOnExerciseSubmit).toHaveBeenCalledTimes(2);
      expect(mockOnExerciseSubmit).toHaveBeenCalledWith('This is my answer', true);
    });

    test('success status shows after save completes', async () => {
      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Trigger blur event
      fireEvent.blur(textarea);

      // Wait for success status to appear
      await waitFor(() => {
        expect(getByText(container, 'Answer saved')).toBeTruthy();
      }, { timeout: 1000 });

      // Check that the success message is visible
      expect(getByText(container, 'Answer saved')).toBeTruthy();
    });

    test('textarea has proper accessibility attributes', () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.getAttribute('aria-label')).toBe(`Writing exercise: ${mockArgs.title}`);
      expect(textarea.getAttribute('aria-describedby')).toBe('save-status-message');
      expect(textarea.getAttribute('aria-required')).toBe('false');
    });

    test('textarea shows different placeholder when not logged in', () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn={false} />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.placeholder).toBe('Create an account to save your answers');
      expect(textarea.disabled).toBe(true);
    });

    test('textarea shows correct placeholder when logged in', () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.placeholder).toBe('Enter your answer here');
      expect(textarea.disabled).toBe(false);
    });
  });
});
