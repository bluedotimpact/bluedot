import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

describe('MarkdownExtendedRenderer', () => {
  test('renders nothing when children is undefined', () => {
    const { container } = render(<MarkdownExtendedRenderer />);
    const element = container.querySelector('.markdown-extended-renderer');
    expect(element).toBeNull();
  });

  test('renders nothing when children is empty string', () => {
    const emptyString = '';
    const { container } = render(<MarkdownExtendedRenderer>
      {emptyString}
    </MarkdownExtendedRenderer>);
    const element = container.querySelector('.markdown-extended-renderer');
    expect(element).toBeNull();
  });

  test('renders basic markdown content', async () => {
    const { container } = render(<MarkdownExtendedRenderer>
      {'# Hello\n\nThis is some text with _italic content_'}
    </MarkdownExtendedRenderer>);

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('em')).toBeTruthy();
    });

    expect(container.querySelector('h1')!.textContent).toBe('Hello');
    expect(container.querySelector('em')!.textContent).toBe('italic content');
  });

  test('renders content with Greeting component', async () => {
    const { container } = render(<MarkdownExtendedRenderer>
      {'<Greeting>World</Greeting>'}
    </MarkdownExtendedRenderer>);

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(container.querySelector('p')).toBeTruthy();
    });

    expect(container.querySelector('p')?.textContent).toBe('Hello World');
  });

  describe('escaping logic', () => {
    test('unescapes markdown characters in component attributes', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'<Callout title="Characters \\_ \\* \\[ \\] \\( \\) \\# \\+ \\- \\. \\! \\` \\~ are unescaped">Content</Callout>'}
      </MarkdownExtendedRenderer>);

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(container.querySelector('.callout')).toBeTruthy();
      });

      const titleElement = container.querySelector('.collapsible__title');
      expect(titleElement?.textContent).toBe('Characters _ * [ ] ( ) # + - . ! ` ~ are unescaped');
    });

    test('preserves escaped characters in regular markdown text', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'Regular markdown with \\_escaped\\_ characters'}
      </MarkdownExtendedRenderer>);

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(container.querySelector('p')).toBeTruthy();
      });

      // The text should still have escaped underscores (not rendered as italics)
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toBe('Regular markdown with _escaped_ characters');
      expect(paragraph?.querySelector('em')).toBeFalsy(); // No italics element should be present
    });

    test('handles multiple escaped characters in component attributes', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'<Callout title="Multiple \\*escaped\\* \\[characters\\] with \\(different\\) \\`symbols\\`">Content</Callout>'}
      </MarkdownExtendedRenderer>);

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(container.querySelector('.callout')).toBeTruthy();
      });

      // The title should have all unescaped characters
      const titleElement = container.querySelector('.collapsible__title');
      expect(titleElement?.textContent).toBe('Multiple *escaped* [characters] with (different) `symbols`');
    });

    test('handles double backslashes in component attributes to render actual backslashes', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'<Callout title="The backslash symbol (\\\\) is used to escape">Content</Callout>'}
      </MarkdownExtendedRenderer>);

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(container.querySelector('.callout')).toBeTruthy();
      });

      // The title should have an actual backslash
      const titleElement = container.querySelector('.collapsible__title');
      expect(titleElement?.textContent).toBe('The backslash symbol (\\) is used to escape');
    });
  });

  describe('markdown rendering fixes', () => {
    test('preprocesses content: escapes < characters, converts autolinks, preserves MDX components', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'Used by <2000 users.\n\nVisit <https://example.com> for info.\n\n<Greeting>World</Greeting>'}
      </MarkdownExtendedRenderer>);

      await waitFor(() => {
        expect(container.querySelector('p')).toBeTruthy();
        expect(container.querySelector('a')).toBeTruthy();
      });

      const paragraphs = container.querySelectorAll('p');

      // < characters render correctly
      expect(paragraphs[0]?.textContent).toBe('Used by <2000 users.');

      // Autolinks are converted to clickable links
      const link = container.querySelector('a');
      expect(link?.getAttribute('href')).toBe('https://example.com');
      expect(link?.getAttribute('target')).toBe('_blank');

      // MDX components still work
      expect(paragraphs[2]?.textContent).toBe('Hello World');
    });

    test('remark-breaks plugin: single newlines create line breaks', async () => {
      const { container } = render(<MarkdownExtendedRenderer>
        {'First line\nSecond line\nThird line'}
      </MarkdownExtendedRenderer>);

      await waitFor(() => {
        expect(container.querySelector('p')).toBeTruthy();
      });

      const paragraph = container.querySelector('p');
      const brTags = paragraph?.querySelectorAll('br');
      expect(brTags?.length).toBe(2); // 2 line breaks for 3 lines
    });
  });
});
