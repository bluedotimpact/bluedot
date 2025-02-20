import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  test('returns null if no items are given', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders all urls and titles in the document', () => {
    const items = [
      { title: 'HomePage', url: '/' },
      { title: 'AboutPage', url: '/about' },
    ];

    const { container } = render(<Breadcrumbs items={items} />);

    expect(container).toMatchSnapshot();

    items.forEach((item) => {
      const linkElement = screen.getByText(item.title);
      expect(linkElement).not.toBeNull();
      expect(linkElement.getAttribute('href')).toContain(item.url);
    });
  });
});
