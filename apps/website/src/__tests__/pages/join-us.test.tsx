import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinUsPage from '../../pages/join-us';
import { TrpcProvider } from '../trpcProvider';

describe('JoinUsPage', () => {
  test('should render correctly', () => {
    const { container } = render(<JoinUsPage />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
