import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListGroup, ListRow } from './ListRow';

describe('ListRow', () => {
  test('renders the whole row as one link with the CTA inside it', () => {
    const { container } = render(<ListRow href="/grants/rapid" title="Rapid Grants" summary="Summary" meta="Meta" />);

    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.getAttribute('href')).toBe('/grants/rapid');
    expect(anchors[0]?.textContent).toContain('Rapid Grants');
    expect(anchors[0]?.textContent).toContain('Learn more');
    expect(container).toMatchSnapshot();
  });

  test('renders a static div with no CTA when href is omitted', () => {
    const { container } = render(<ListRow title="No link" summary="Summary" />);

    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).not.toContain('Learn more');
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  test('absolute URLs open in a new tab and announce it', () => {
    const { container } = render(<ListRow href="https://example.com" title="External" />);

    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText('(opens in a new tab)').className).toContain('sr-only');
  });
});

describe('ListGroup', () => {
  test('wraps each row in a list item with dividers and an optional heading', () => {
    const { container } = render(<ListGroup label="Open roles">
      <ListRow href="/a" title="A" />
      <ListRow href="/b" title="B" />
    </ListGroup>);

    expect(container.querySelector('h3')?.textContent).toBe('Open roles');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('ul')?.className).toContain('divide-y');
  });

  test('skips null and false children', () => {
    const show = false;
    const { container } = render(<ListGroup>
      <ListRow href="/a" title="A" />
      {show && <ListRow href="/b" title="B" />}
      {null}
    </ListGroup>);

    expect(container.querySelectorAll('li')).toHaveLength(1);
  });

  test('renders nothing when every child is empty', () => {
    const { container } = render(<ListGroup>{null}{false}</ListGroup>);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when empty', () => {
    const { container } = render(<ListGroup>{[]}</ListGroup>);
    expect(container.firstChild).toBeNull();
  });
});
