import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import * as deviceDetect from 'react-device-detect';
import HistorySection from './HistorySection';

describe('HistorySection', () => {
  test('renders desktop as expected', () => {
    const { container } = render(<HistorySection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.history-section__event-container--desktop')).not.toBeNull();
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<HistorySection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.history-section__event-container--mobile')).not.toBeNull();
    vi.clearAllMocks();
  });
});
