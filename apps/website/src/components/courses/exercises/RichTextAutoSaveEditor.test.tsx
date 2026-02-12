import { render, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import RichTextAutoSaveEditor from './RichTextAutoSaveEditor';

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  onSave: vi.fn().mockResolvedValue({}),
  placeholder: 'Enter text here',
};

describe('RichTextAutoSaveEditor', () => {
  test('renders editor with correct structure', async () => {
    const { container } = render(<RichTextAutoSaveEditor
      {...defaultProps}
      height="short"
      className="custom-class"
    />);

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    // Basic structure exists
    expect(container.querySelector('.custom-class')).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy(); // drag notches
    expect(container.querySelector('[aria-label="Rich text input area"]')).toBeTruthy();
    // Note: SaveStatusIndicator returns null when status is 'idle' (initial state)
    // It only renders when saving/saved/error - tested via integration
  });

  test('loads and displays existing content', async () => {
    const { container } = render(<RichTextAutoSaveEditor
      {...defaultProps}
      value="This is existing content from a saved response"
    />);

    await waitFor(() => {
      const editor = container.querySelector('.ProseMirror');
      expect(editor?.textContent).toContain('This is existing content');
    });
  });

  test('disabled state makes editor non-editable and hides save indicator', async () => {
    const { container } = render(<RichTextAutoSaveEditor
      {...defaultProps}
      disabled
    />);

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    const editor = container.querySelector('.ProseMirror')!;
    expect(editor.getAttribute('contenteditable')).toBe('false');

    // No save status indicator when disabled
    expect(container.querySelector('#save-status-message')).toBeNull();
  });

  test('has same props interface as AutoSaveTextarea (drop-in replacement)', () => {
    // This test documents the expected props interface
    const props: React.ComponentProps<typeof RichTextAutoSaveEditor> = {
      value: 'test',
      onChange: vi.fn(),
      onSave: vi.fn().mockResolvedValue({}),
      placeholder: 'Enter text',
      disabled: false,
      height: 'short',
      className: 'custom',
    };

    const { container } = render(<RichTextAutoSaveEditor {...props} />);
    expect(container.querySelector('.flex')).toBeTruthy();
  });
});
