import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import posthog from 'posthog-js';
import { CookieBanner } from './CookieBanner';

// Mock the entire posthog-js module
vi.mock('posthog-js');

describe('CookieBanner', () => {
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    setItemSpy.mockClear();
    getItemSpy.mockClear();
    vi.mocked(posthog.opt_in_capturing).mockClear();
    vi.mocked(posthog.opt_out_capturing).mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders as expected', () => {
    const { container } = render(<CookieBanner />);
    expect(container).toMatchSnapshot();
  });

  test('sets localStorage item and allows tracking when accepted', () => {
    const { container } = render(<CookieBanner />);
    const acceptButton = container.querySelector('.cookie-banner__button--accept');

    expect(acceptButton).not.toBeNull();

    fireEvent.click(acceptButton!);

    expect(setItemSpy).toHaveBeenCalledWith('cookies', 'accepted');
    expect(posthog.opt_in_capturing).toHaveBeenCalled();
  });

  test('sets localStorage item and opts out of tracking when rejected', () => {
    const { container } = render(<CookieBanner />);
    const rejectButton = container.querySelector('.cookie-banner__button--reject');

    expect(rejectButton).not.toBeNull();

    fireEvent.click(rejectButton!);

    expect(setItemSpy).toHaveBeenCalledWith('cookies', 'rejected');
    expect(posthog.opt_out_capturing).toHaveBeenCalled();
  });

  test('does not render if "cookies" is already set', () => {
    localStorage.setItem('cookies', 'accepted');
    const { container } = render(<CookieBanner />);
    expect(container.firstChild).toBeNull();
  });
});
