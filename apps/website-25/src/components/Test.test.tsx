import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Test from './Test';

describe('Test', () => {
  test('should render the error message correctly', () => {
    const { container } = render(<Test />);
    expect(container).toMatchSnapshot();
  });
});
