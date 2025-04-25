import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinUsCta from './JoinUsCta';

describe('JoinUsCta', () => {
  test('renders default as expected', () => {
    const { container } = render(<JoinUsCta />);
    expect(container).toMatchSnapshot();
  });
});
