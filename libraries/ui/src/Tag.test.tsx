import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  test('renders default as expected', () => {
    const { container } = render(<Tag>Basic tag</Tag>);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(<Tag
      className="custom-class"
    >
      Custom tag
    </Tag>);
    const tagEl = container.querySelector('.custom-class');
    expect(tagEl).toMatchSnapshot();
  });
});
