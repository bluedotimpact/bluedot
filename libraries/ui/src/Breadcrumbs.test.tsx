import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

const route = {
  title: 'Unit 1',
  url: '/courses/future-of-ai/1',
  parentPages: [
    { title: 'Home', url: '/' },
    { title: 'Courses', url: '/courses' },
    { title: 'Future of AI', url: '/courses/future-of-ai' },
  ],
};

describe('Breadcrumbs', () => {
  test('renders parent pages as links and the current page as plain text', () => {
    const { container } = render(<Breadcrumbs route={route} />);

    expect(container).toMatchSnapshot();

    route.parentPages.forEach((page) => {
      expect(screen.getByRole('link', { name: page.title }).getAttribute('href')).toBe(page.url);
    });

    const current = screen.getByText(route.title);
    expect(current.tagName).toBe('SPAN');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('link', { name: route.title })).toBeNull();
  });

  test('collapses middle crumbs to an ellipsis on mobile when there are more than two', () => {
    render(<Breadcrumbs route={route} />);

    ['Courses', 'Future of AI'].forEach((title) => {
      expect(screen.getByText(title).closest('li')?.classList.contains('hidden')).toBe(true);
    });
    expect(screen.getByText('Home').closest('li')?.classList.contains('hidden')).toBe(false);

    const ellipsis = screen.getByText('…');
    expect(ellipsis.getAttribute('aria-hidden')).toBe('true');
    expect(ellipsis.closest('li')).toBe(screen.getByText('Home').closest('li'));
  });

  test('does not render an ellipsis for two-level trails', () => {
    render(<Breadcrumbs route={{ title: 'About', url: '/about', parentPages: [{ title: 'Home', url: '/' }] }} />);

    expect(screen.queryByText('…')).toBeNull();
  });
});
