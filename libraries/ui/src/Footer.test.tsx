import { describe, expect, test } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  test('renders default as expected', () => {
    const { container } = render(<Footer />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(<Footer logo="https://www.bluedot.com/test-logo.jpg" />);
    expect(container).toMatchSnapshot();
  });
});
