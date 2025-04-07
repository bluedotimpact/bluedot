import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
} from 'vitest';
import HistorySection from './HistorySection';
import { cleanupGlobalMocks, mockIntersectionObserver } from '../../__tests__/utils';

describe('HistorySection', () => {
  beforeAll(() => {
    mockIntersectionObserver();
  });

  afterAll(() => {
    cleanupGlobalMocks();
  });

  test('renders as expected', () => {
    const { container } = render(<HistorySection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.history-section')).not.toBeNull();
  });
});
