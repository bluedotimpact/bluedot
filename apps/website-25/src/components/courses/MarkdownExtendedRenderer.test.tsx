import { render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

describe('MarkdownExtendedRenderer', () => {
  test('renders nothing when children is undefined', () => {
    const { container } = render(<MarkdownExtendedRenderer />);
    const element = container.querySelector('.markdown-extended-renderer');
    expect(element?.children.length).toBe(0);
  });

  test('renders nothing when children is empty string', () => {
    const emptyString = '';
    const { container } = render(
      <MarkdownExtendedRenderer>
        {emptyString}
      </MarkdownExtendedRenderer>,
    );
    const element = container.querySelector('.markdown-extended-renderer');
    expect(element?.children.length).toBe(0);
  });

  test('renders basic markdown content', async () => {
    const { container } = render(
      <MarkdownExtendedRenderer>
        # Hello
      </MarkdownExtendedRenderer>,
    );

    // Wait for the useEffect to run
    await vi.waitFor(() => {
      expect(container.querySelector('h1')).toBeTruthy();
    });

    expect(container.querySelector('h1')?.textContent).toBe('Hello');
  });

  test('renders content with Greeting component', async () => {
    const { container } = render(
      <MarkdownExtendedRenderer>
        {'<Greeting>World</Greeting>'}
      </MarkdownExtendedRenderer>,
    );

    // Wait for the useEffect to run
    await vi.waitFor(() => {
      expect(container.querySelector('p')).toBeTruthy();
    });

    expect(container.querySelector('p')?.textContent).toBe('Hello World');
  });
});
