import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  test('renders default as expected', () => {
    const { container, getAllByRole } = render(<Footer />);
    expect(getAllByRole('link', { name: 'Contact & legal' })).toHaveLength(3);
    expect(getAllByRole('link', { name: 'Contact & legal' })[0]?.getAttribute('href')).toBe('/contact');
    expect(container.textContent).not.toContain('1680 Mission');
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container, getAllByRole } = render(<Footer
      logo="https://www.bluedot.com/test-logo.jpg"
      grants={[{ path: '/grants/rapid', title: 'Rapid Grants' }]}
    />);
    expect(getAllByRole('link', { name: 'Rapid Grants' })).toHaveLength(3);
    expect(container).toMatchSnapshot();
  });

  test('renders with "report a bug" when onReportBug is provided', () => {
    const { container } = render(<Footer onReportBug={() => {}} />);
    expect(container).toMatchSnapshot();
  });
});
