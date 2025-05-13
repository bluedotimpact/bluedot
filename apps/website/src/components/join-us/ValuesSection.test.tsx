import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import * as deviceDetect from 'react-device-detect';
import ValuesSection from './ValuesSection';

describe('ValuesSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<ValuesSection />);
    expect(container).toMatchSnapshot();
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<ValuesSection />);
    expect(container).toMatchSnapshot();
    vi.clearAllMocks();
  });
});
