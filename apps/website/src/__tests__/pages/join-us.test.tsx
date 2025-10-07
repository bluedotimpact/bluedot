import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinUsPage from '../../pages/join-us';
import { TrpcWrapper } from '../trpcWrapper';

describe('JoinUsPage', () => {
  test('should render correctly', () => {
    const { container } = render(<JoinUsPage />, { wrapper: TrpcWrapper });
    expect(container).toMatchSnapshot();
  });
});
