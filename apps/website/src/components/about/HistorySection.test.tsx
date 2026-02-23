import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import HistorySection from './HistorySection';

describe('HistorySection', () => {
  test('renders desktop as expected', () => {
    const { container } = render(<HistorySection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.history-section__event-container--desktop')).not.toBeNull();
  });
});
