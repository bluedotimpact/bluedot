import {
  render, waitFor, fireEvent, getByRole, getByText,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    // Wait for TipTap editor to render
    await waitFor(() => {
      const editor = container.querySelector('.ProseMirror');
      expect(editor).toBeTruthy();
      expect(editor?.textContent).toContain('This is my saved answer.');
    });

    expect(container).toMatchSnapshot();
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('does not show status immediately while typing (20-second auto-save delay)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Should not show any status message immediately while typing
      const statusElement = container.querySelector('#save-status-message');
      expect(statusElement).toBeNull();
    });

    test('triggers auto-save when user clicks outside after typing', async () => {
      const user = userEvent.setup();
      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Trigger blur by clicking outside (on the container)
      await user.click(container);

      // Wait for save to complete (may go through Saving... too fast to catch reliably)
      await waitFor(() => {
        expect(mockOnExerciseSubmit).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Should show success status after save completes
      await waitFor(() => {
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 3000 });
    });

    test('does not auto-save when user is not logged in', async () => {
      const mockOnExerciseSubmit = vi.fn();
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn={false} />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Attempt to type (editor should be disabled)
      fireEvent.input(editor, { target: { innerHTML: '<p>This is my answer</p>' } });

      // Trigger blur event
      fireEvent.blur(editor);

      // Wait a bit
      await new Promise((resolve) => { setTimeout(resolve, 100); });

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

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Trigger blur without changing content
      fireEvent.blur(editor);

      // Wait a bit
      await new Promise((resolve) => { setTimeout(resolve, 100); });

      // Should not call onExerciseSubmit
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();
    });

    test('shows error status when save fails', async () => {
      const user = userEvent.setup();
      const mockOnExerciseSubmit = vi.fn().mockRejectedValue(new Error('Save failed'));
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Trigger blur by clicking outside
      await user.click(container);

      // Wait for error status to appear (may skip Saving... if too fast)
      await waitFor(() => {
        expect(getByText(container, "Couldn't save answer.")).toBeTruthy();
        expect(getByRole(container, 'button', { name: /retry/i })).toBeTruthy();
      }, { timeout: 3000 });
    });

    test('retry functionality works when save fails', async () => {
      const user = userEvent.setup();
      const mockOnExerciseSubmit = vi.fn()
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({});

      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Trigger blur by clicking outside
      await user.click(container);

      // Wait for error status to appear
      await waitFor(() => {
        expect(getByText(container, "Couldn't save answer.")).toBeTruthy();
      }, { timeout: 3000 });

      // Click retry button
      const retryButton = getByRole(container, 'button', { name: /retry/i });
      await user.click(retryButton);

      // Should eventually show success (may transition through Saving... too fast to catch)
      await waitFor(() => {
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 3000 });

      // Should have been called twice (initial attempt + retry)
      expect(mockOnExerciseSubmit).toHaveBeenCalledTimes(2);
    });

    test('success status shows after save completes', async () => {
      const user = userEvent.setup();
      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Trigger blur by clicking outside
      await user.click(container);

      // Wait for success status to appear
      await waitFor(() => {
        expect(getByText(container, 'Saved')).toBeTruthy();
      }, { timeout: 3000 });

      // Check that the success message is visible
      expect(getByText(container, 'Saved')).toBeTruthy();
    });

    test('triggers periodic auto-save after 3 minutes with unsaved changes', async () => {
      // Use fake timers for this test to control time advancement
      // userEvent needs advanceTimers option with fake timers
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const mockOnExerciseSubmit = vi.fn().mockResolvedValue({});
      const { container } = render(
        <FreeTextResponse {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />,
      );

      await vi.waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;

      // Type in the editor using userEvent with fake timers
      await user.click(editor);
      await user.type(editor, 'This is my answer');

      // Verify save hasn't been called yet
      expect(mockOnExerciseSubmit).not.toHaveBeenCalled();

      // Advance time by 3 minutes (180000ms) and run all pending timers
      await vi.advanceTimersByTimeAsync(180000);

      // Verify save was called
      await vi.waitFor(() => {
        expect(mockOnExerciseSubmit).toHaveBeenCalled();
      });

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

    test('editor has proper accessibility attributes', async () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      await waitFor(() => {
        const editorContent = container.querySelector('[aria-label="Rich text input area"]');
        expect(editorContent).toBeTruthy();
        expect(editorContent?.getAttribute('aria-describedby')).toBe('save-status-message');
      });
    });

    test('editor is disabled when not logged in', async () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn={false} />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;
      expect(editor.getAttribute('contenteditable')).toBe('false');
    });

    test('editor is enabled when logged in', async () => {
      const { container } = render(
        <FreeTextResponse {...mockArgs} isLoggedIn />,
      );

      await waitFor(() => {
        expect(container.querySelector('.ProseMirror')).toBeTruthy();
      });

      const editor = container.querySelector('.ProseMirror') as HTMLElement;
      expect(editor.getAttribute('contenteditable')).toBe('true');
    });
  });
});
