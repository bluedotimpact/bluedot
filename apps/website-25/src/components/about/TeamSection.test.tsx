import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import * as deviceDetect from 'react-device-detect';
import TeamSection from './TeamSection';

describe('TeamSection', () => {
  test('renders desktop as expected', () => {
    const { container } = render(<TeamSection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.team-section--desktop')).not.toBeNull();
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<TeamSection />);
    expect(container).toMatchSnapshot();
    expect(container.querySelector('.team-section--mobile')).not.toBeNull();
    vi.clearAllMocks();
  });
});
