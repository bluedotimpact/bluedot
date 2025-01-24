import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Nav } from './Nav';

describe('Nav', () => {
  test('renders default as expected', () => {
    const { container } = render(<Nav />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <Nav
        logo="logo.png"
        courses={[
          { title: 'Course 1', href: '/course1' },
          { title: 'Course 2', href: '/course2', isNew: true },
        ]}
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
