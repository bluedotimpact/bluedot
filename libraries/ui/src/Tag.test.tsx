import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  test('renders default as expected', () => {
    const { container } = render(<Tag label="Basic tag" />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(
      <Tag
        label="Custom tag"
        className="custom-class"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
