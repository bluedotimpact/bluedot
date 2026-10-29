import { render, waitFor } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test,
} from 'vitest';
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

      const titleElement = container.querySelector('summary');
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
      const titleElement = container.querySelector('summary');
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
      const titleElement = container.querySelector('summary');
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

  describe('plainMarkdown', () => {
    const renderPlain = async (text: string) => {
      const { container } = render(<MarkdownExtendedRenderer plainMarkdown>{text}</MarkdownExtendedRenderer>);
      await waitFor(() => {
        expect(container.querySelector('.markdown-extended-renderer')?.firstElementChild).toBeTruthy();
      });
      return container.querySelector('.markdown-extended-renderer')!;
    };

    test('shows set notation in braces as typed', async () => {
      const root = await renderPlain('Sets a{x, y}, b{p q, r s}');
      expect(root.innerHTML).toBe('<p>Sets a{x, y}, b{p q, r s}</p>');
    });

    test('shows a word in braces as typed', async () => {
      const root = await renderPlain('Say {name} here');
      expect(root.innerHTML).toBe('<p>Say {name} here</p>');
    });

    test('shows braces around numbers as typed', async () => {
      const root = await renderPlain('{1, 2}');
      expect(root.innerHTML).toBe('<p>{1, 2}</p>');
    });

    test('shows import lines as typed', async () => {
      const root = await renderPlain('import x from "y"\n\nThen more');
      expect(root.querySelectorAll('p')[0]?.textContent).toBe('import x from "y"');
      expect(root.querySelectorAll('p')[1]?.textContent).toBe('Then more');
    });

    test('shows braces in code without backslashes', async () => {
      const root = await renderPlain('Use `{a: 1}` or\n\n```\nconst o = { b: 2 };\n```');
      expect(root.querySelector('p code')?.textContent).toBe('{a: 1}');
      expect(root.querySelector('pre code')?.textContent).toBe('const o = { b: 2 };\n');
    });

    test('keeps a typed backslash brace in a code span', async () => {
      const root = await renderPlain('Type `\\{` to escape');
      expect(root.querySelector('code')?.textContent).toBe('\\{');
    });

    test('keeps an indented line as a paragraph, not code', async () => {
      const root = await renderPlain('First point\n\n    indented point');
      expect(root.querySelector('pre')).toBeNull();
      expect(root.querySelectorAll('p')[1]?.textContent).toBe('indented point');
    });

    test('keeps bold, lists, line breaks and < as before', async () => {
      const root = await renderPlain('**bold** text\nnext line\n\n- one\n- two\n\nUsed by <2000 users');
      expect(root.querySelector('strong')?.textContent).toBe('bold');
      expect(root.querySelectorAll('p')[0]?.querySelectorAll('br').length).toBe(1);
      expect(root.querySelectorAll('li').length).toBe(2);
      expect(root.querySelectorAll('p')[1]?.textContent).toBe('Used by <2000 users');
    });
  });

  describe('plainMarkdown links', () => {
    const renderLink = async (markdown: string) => {
      const { container } = render(<MarkdownExtendedRenderer plainMarkdown>{markdown}</MarkdownExtendedRenderer>);
      await waitFor(() => {
        expect(container.querySelector('.markdown-extended-renderer p')).toBeTruthy();
      });
      return container.querySelector('.markdown-extended-renderer p')!;
    };

    test.each([
      ['javascript', '[click](javascript:void(0))'],
      ['JAVASCRIPT with leading spaces', '[click](   JAVASCRIPT:void(0))'],
      ['reference-style javascript', '[click][r]\n\n[r]: javascript:void(0)'],
      ['entity-encoded javascript', '[click](&#106;avascript:void(0))'],
      ['data', '[click](data:text/html,hi)'],
    ])('shows a %s link as text only', async (_name, markdown) => {
      const paragraph = await renderLink(markdown);
      expect(paragraph.querySelector('a')).toBeNull();
      expect(paragraph.textContent).toBe('click');
    });

    test.each([
      ['https://example.com', '_blank'],
      ['mailto:someone@example.com', null],
      ['/courses', null],
      ['#notes', null],
    ])('keeps a link to %s', async (href, target) => {
      const paragraph = await renderLink(`[click](${href})`);
      const link = paragraph.querySelector('a');
      expect(link?.getAttribute('href')).toBe(href);
      expect(link?.getAttribute('target')).toBe(target);
      expect(link?.textContent).toBe('click');
    });
  });

  describe('when the content does not compile', () => {
    // The renderer rethrows so the error is still reported; catch it here so the test run doesn't fail
    let rejections: unknown[] = [];
    let savedListeners: NodeJS.UnhandledRejectionListener[] = [];
    const capture = (reason: unknown) => {
      rejections.push(reason);
    };

    beforeEach(() => {
      rejections = [];
      savedListeners = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', capture);
    });

    afterEach(() => {
      process.removeListener('unhandledRejection', capture);
      savedListeners.forEach((listener) => process.on('unhandledRejection', listener));
    });

    test('shows the raw text and still reports the error', async () => {
      const { container } = render(<MarkdownExtendedRenderer>{'Bad {a b} here'}</MarkdownExtendedRenderer>);

      await waitFor(() => {
        expect(container.querySelector('.markdown-extended-renderer p')?.textContent).toBe('Bad {a b} here');
      });
      await waitFor(() => {
        expect(rejections).toHaveLength(1);
      });
      expect(String(rejections[0])).toContain('Could not parse expression with acorn');
    });

    test('clears the raw text once the content compiles', async () => {
      const { container, rerender } = render(<MarkdownExtendedRenderer>{'Bad {a b} here'}</MarkdownExtendedRenderer>);
      await waitFor(() => {
        expect(container.querySelector('.markdown-extended-renderer p')?.textContent).toBe('Bad {a b} here');
      });

      rerender(<MarkdownExtendedRenderer>{'Good _text_'}</MarkdownExtendedRenderer>);

      await waitFor(() => {
        expect(container.querySelector('em')?.textContent).toBe('text');
      });
      expect(container.querySelector('.markdown-extended-renderer')?.textContent).toBe('Good text');
      expect(rejections).toHaveLength(1);
    });
  });
});
