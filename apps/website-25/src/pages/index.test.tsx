import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import HomePage from './index';

describe('Homepage', () => {
  test('renders full page as expected', () => {
    const { container } = render(<HomePage />);
    expect(container).toMatchSnapshot();
  });
});
