import {
  render, waitFor, fireEvent, getByRole, getByText,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import { useRouter } from 'next/router';
import FreeTextResponse from './FreeTextResponse';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/test-path',
};

// Setup router mock before each test
beforeEach(() => {
  (useRouter as Mock).mockReturnValue(mockRouter);
  // Use real timers by default (most tests need them for async operations)
  vi.useRealTimers();
});

// Clean up after each test
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
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

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container).toMatchSnapshot();
    expect(container.querySelector('#save-status-message')).toBeFalsy();
  });

  test('renders logged in as expected', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container).toMatchSnapshot();
    expect(container.querySelector('#save-status-message')).toBeFalsy();
  });

  test('renders with saved exercise response', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} exerciseResponse="This is my saved answer." isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    const textareaEl = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(container).toMatchSnapshot();
    expect(textareaEl.value).toBe('This is my saved answer.');
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('does not show status immediately while typing (20-second auto-save delay)', async () => {
      // Use fake timers for this test to control time advancement
      vi.useFakeTimers();

      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Should not show any status message immediately while typing
      const statusElement = container.querySelector('#save-status-message');
      expect(statusElement).toBeNull();

      // Even after advancing time less than 20 seconds, should not show status
      vi.advanceTimersByTime(10000); // 10 seconds
      expect(container.querySelector('#save-status-message')).toBeNull();

      // Clean up: switch back to real timers
      vi.useRealTimers();
    });

    test('triggers auto-save when user clicks outside after typing', async () => {
      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Trigger blur event (clicking outside)
      fireEvent.blur(textarea);

      // Check that saving status appears
      await waitFor(() => {
        expect(getByText(container, 'Saving...')).toBeTruthy();
      });

      // Check that onExerciseSubmit was called
      expect(mockOnExerciseSubmit).toHaveBeenCalledWith('This is my answer', true);

      // Wait for save to complete and show success
      await waitFor(() => {
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 2000 });
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
        expect(getByText(container, 'Saving...')).toBeTruthy();
      });

      // Wait for error status to appear
      await waitFor(() => {
        expect(getByText(container, "Couldn't save answer.")).toBeTruthy();
        expect(getByRole(container, 'button', { name: /retry/i })).toBeTruthy();
      }, { timeout: 2000 });

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
      }, { timeout: 2000 });

      // Click retry button
      const retryButton = getByRole(container, 'button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should show saving status again
      await waitFor(() => {
        expect(getByText(container, 'Saving...')).toBeTruthy();
      });

      // Should eventually show success
      await waitFor(() => {
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 2000 });

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
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 2000 });

      // Check that the success message is visible
      expect(getByText(container, 'Saved')).toBeTruthy();
    });

    test('triggers periodic auto-save after 3 minutes with unsaved changes', async () => {
      // Use fake timers for this test to control time advancement
      vi.useFakeTimers();

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // Type in the textarea
      fireEvent.focus(textarea);
      fireEvent.change(textarea, { target: { value: 'This is my answer' } });

      // Verify save hasn't been called yet
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      // Advance time by 3 minutes (180000ms) and run all pending timers
      await vi.advanceTimersByTimeAsync(180000);

      // Verify save was called
      expect(mockOnExerciseSubmit).toHaveBeenCalledWith('This is my answer', true);

      // Clean up: switch back to real timers
      vi.useRealTimers();
    });

    test('does not trigger periodic save when there are no unsaved changes', async () => {
      // Use fake timers for this test to control time advancement
      vi.useFakeTimers();

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      render(
        <FreeTextResponse
          {...mockArgs}
          onExerciseSubmit={mockOnExerciseSubmit}
          exerciseResponse="Already saved answer"
          isLoggedIn
        />,
      );

      // Don't change anything - the value matches the saved response

      // Advance time by 3 minutes (180000ms) and run all pending timers
      await vi.advanceTimersByTimeAsync(180000);

      // Should not have called save since nothing changed
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      // Clean up: switch back to real timers
      vi.useRealTimers();
    });

    test('does not trigger periodic auto-save without focus', async () => {
      vi.useFakeTimers();

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      // Do not make any changes or focus

      // Advance time by 3 minutes
      await vi.advanceTimersByTimeAsync(180000);

      // Should NOT have saved, textarea was never focused
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    test('does not trigger inactivity auto-save without focus', async () => {
      vi.useFakeTimers();

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      // Do not make any changes or focus

      // Advance time by 20 seconds (inactivity delay)
      await vi.advanceTimersByTimeAsync(20000);

      // Should not have saved, textarea was never focused
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    test('textarea has proper accessibility attributes', () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      expect(textarea.getAttribute('aria-label')).toBe('Text input area');
      expect(textarea.getAttribute('aria-describedby')).toBe('save-status-message');
      // aria-required is not set on the textarea, so we check it doesn't exist
      expect(textarea.getAttribute('aria-required')).toBeNull();
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

    test('does not overwrite user input when exerciseResponse prop updates during typing', async () => {
      // This test verifies the fix for issue #1614:
      // If a user continues typing while saving, the refetch triggered by invalidation
      // should not overwrite their new input.

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container, rerender } = render(
        <FreeTextResponse
          {...mockArgs}
          onExerciseSubmit={mockOnExerciseSubmit}
          exerciseResponse=""
          isLoggedIn
        />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

      // User types initial text
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(textarea.value).toBe('Hello');

      // User continues typing before save completes
      fireEvent.change(textarea, { target: { value: 'Hello World' } });
      expect(textarea.value).toBe('Hello World');

      // Simulate the exerciseResponse prop updating (as would happen after refetch)
      // This simulates the server response coming back with the old saved value
      rerender(
        <FreeTextResponse
          {...mockArgs}
          onExerciseSubmit={mockOnExerciseSubmit}
          exerciseResponse="Hello"
          isLoggedIn
        />,
      );

      // Wait a tick for effects to run
      await waitFor(() => {
        // Verify that the user's current input is NOT overwritten
        expect(textarea.value).toBe('Hello World');
      });

      // The local state should take precedence over the refetched server value
      expect(textarea.value).not.toBe('Hello');
    });

    test('syncs exerciseResponse when navigating to a new exercise with empty local state', async () => {
      // This test ensures that when navigating to a different exercise,
      // the saved response is loaded correctly

      const { container, rerender } = render(
        <FreeTextResponse
          {...mockArgs}
          exerciseResponse=""
          isLoggedIn
        />,
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');

      // Simulate navigating to a different exercise with a saved response
      rerender(
        <FreeTextResponse
          {...mockArgs}
          exerciseResponse="Previously saved answer"
          isLoggedIn
        />,
      );

      // Should sync the new exercise's response when answer is empty
      await waitFor(() => {
        expect(textarea.value).toBe('Previously saved answer');
      });
    });
  });
});
