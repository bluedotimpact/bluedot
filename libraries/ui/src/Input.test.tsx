import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  test('renders default as expected', () => {
    const { container } = render(<Input
      type="text"
      label="This is the label"
      placeholder="This is the placeholder"
    />);
    expect(container).toMatchSnapshot();
  });

  test('renders radio as expected', () => {
    const { container } = render(<Input
      type="radio"
      value="This is the value"
      name="radio-group"
    />);
    expect(container).toMatchSnapshot();
  });

  test('renders checkbox as expected', () => {
    const { container } = render(<Input
      type="checkbox"
      value="This is the value"
      name="checkbox-group"
    />);
    expect(container).toMatchSnapshot();
  });
});
