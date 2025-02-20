import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  test('renders all urls and titles in the document', () => {
    const route = {
      title: 'AboutPage',
      url: '/about',
      parentPages: [{ title: 'HomePage', url: '/' }],
    };

    const { container } = render(<Breadcrumbs route={route} />);

    expect(container).toMatchSnapshot();

    const items = [...(route.parentPages ?? []), route];
    items.forEach((item) => {
      const linkElement = screen.getByText(item.title);
      expect(linkElement).not.toBeNull();
      expect(linkElement.getAttribute('href')).toContain(item.url);
    });
  });
});
