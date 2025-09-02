import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, test, expect, vi,
} from 'vitest';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
  test('renders editor container with toolbar and content area', async () => {
    const { container } = render(<MarkdownEditor />);

    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Check toolbar exists
    expect(screen.getByRole('toolbar')).toBeInTheDocument();

    // Check editor content area exists and has correct styling
    const contentEditable = container.querySelector('[contenteditable="true"]');
    expect(contentEditable).toBeInTheDocument();
    expect(contentEditable!.closest('.prose')).toBeInTheDocument();
  });

  test('renders with initial content', async () => {
    const content = '# Hello World';
    render(<MarkdownEditor>{content}</MarkdownEditor>);

    // Wait for editor to initialize and content to be loaded
    await waitFor(() => {
      const editor = screen.getByRole('textbox');
      expect(editor).toBeInTheDocument();
      expect(editor.textContent).toBe('Hello World');
    });

    // Verify heading is rendered properly
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Hello World');
  });

  test('triggers onChange when content is modified', async () => {
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor onChange={onChange} />);

    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Get the contentEditable element
    const contentEditable = container.querySelector('[contenteditable="true"]');
    expect(contentEditable).toBeInTheDocument();

    // Focus and type some text
    const editorElement = contentEditable as HTMLElement;
    editorElement.focus();
    editorElement.innerHTML = 'Hello editor';

    // Verify onChange was called with markdown
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('Hello editor');
    });
  });

  test('editor toolbar contains format buttons', async () => {
    render(<MarkdownEditor />);

    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Check for common formatting buttons
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toContainElement(screen.getByLabelText('Bold'));
    expect(toolbar).toContainElement(screen.getByLabelText('Italic'));
  });

  test('bold button applies formatting and triggers onChange with bolded text', async () => {
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor onChange={onChange} />);

    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Get the contentEditable element
    const contentEditable = container.querySelector('[contenteditable="true"]');
    expect(contentEditable).toBeInTheDocument();

    // Focus and type some text
    const editorElement = contentEditable as HTMLElement;
    editorElement.focus();
    editorElement.innerHTML = 'Test text';

    // Clear the mock to ignore the initial text input
    onChange.mockClear();

    // Find and click the bold button
    const boldButton = screen.getByLabelText('Bold');
    boldButton.click();

    // Verify onChange was called with markdown bold syntax
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      // The exact format might depend on the Markdown parser implementation
      // but typically bold text is wrapped with ** or __
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**Test text**'));
    });

    // Check that the content is rendered in a <strong> tag
    await waitFor(() => {
      const boldElement = container.querySelector('strong');
      expect(boldElement).toBeInTheDocument();
      expect(boldElement).toHaveTextContent('Test text');
    });
  });
});
