import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FoAICongratulations from './FoAICongratulations';

describe('FoAICongratulations', () => {
  test('renders default as expected', () => {
    const { container } = render(<FoAICongratulations />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(<FoAICongratulations className="max-w-2xl mx-auto" />);
    expect(container).toMatchSnapshot();
  });
});
