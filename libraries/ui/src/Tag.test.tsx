import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  test('renders default as expected', () => {
    const { container } = render(<Tag>Basic tag</Tag>);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    render(
      <Tag
        dataTestId="tag"
        className="custom-class"
      >
        Custom tag
      </Tag>,
    );
    const tagEl = screen.getByTestId('tag');
    expect(tagEl).toMatchSnapshot();
  });
});
