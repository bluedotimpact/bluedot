import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinUsPage from '../../pages/join-us';

describe('JoinUsPage', () => {
  test('should render the error message correctly', () => {
    const { container } = render(<JoinUsPage />);
    expect(container).toMatchSnapshot();
  });
});
