import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import BlogSection from './BlogSection';

describe('BlogSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<BlogSection />);
    expect(container).toMatchSnapshot();
  });
});
