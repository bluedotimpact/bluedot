import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Nav } from './Nav';

describe('Footer', () => {
  test('renders default as expected', () => {
    const { container } = render(<Nav />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <Nav
        logo="logo.png"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional yield', () => {
    const { container } = render(
      <Nav>
        <p>This is the yield</p>
      </Nav>,
    );
    expect(container).toMatchSnapshot();
  });
});
