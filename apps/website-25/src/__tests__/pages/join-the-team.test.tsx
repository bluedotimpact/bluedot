import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinTheTeamPage from '../../pages/join-the-team';

describe('JoinTheTeamPage', () => {
  test('should render the error message correctly', () => {
    const { container } = render(<JoinTheTeamPage />);
    expect(container).toMatchSnapshot();
  });
});
