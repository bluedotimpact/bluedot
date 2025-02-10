import { render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import * as deviceDetect from 'react-device-detect';
import CareersSection from './CareersSection';

describe('CareersSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<CareersSection />);
    expect(container.querySelector('.careers-section__card--desktop')).not.toBeNull();
    expect(container.querySelector('.careers-section__card--mobile')).toBeNull();
    expect(container).toMatchSnapshot();
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<CareersSection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.careers-section__card--desktop')).toBeNull();
    expect(container.querySelector('.careers-section__card--mobile')).not.toBeNull();
    vi.clearAllMocks();
  });
});
