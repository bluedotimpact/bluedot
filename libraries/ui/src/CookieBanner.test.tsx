import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner', () => {
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
  const mockPosthogOptOut = vi.fn();
  const mockPosthogOptIn = vi.fn();

  beforeEach(() => {
    // Clear any previous state
    cleanup();
    localStorage.clear();
    setItemSpy.mockClear();
    getItemSpy.mockClear();
    mockPosthogOptOut.mockClear();
    mockPosthogOptIn.mockClear();

    // Mock posthog global object with both opt-in and opt-out functions
    (window as any).posthog = {
      opt_out_capturing: mockPosthogOptOut,
      opt_in_capturing: mockPosthogOptIn,
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as any).posthog;
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
    expect(mockPosthogOptIn).toHaveBeenCalled();
    expect(mockPosthogOptOut).not.toHaveBeenCalled();
  });

  test('sets localStorage item and opts out of tracking when rejected', () => {
    const { container } = render(<CookieBanner />);
    const rejectButton = container.querySelector('.cookie-banner__button--reject');

    expect(rejectButton).not.toBeNull();

    fireEvent.click(rejectButton!);

    expect(setItemSpy).toHaveBeenCalledWith('cookies', 'rejected');
    expect(mockPosthogOptOut).toHaveBeenCalled();
    expect(mockPosthogOptIn).not.toHaveBeenCalled();
  });

  test('does not render if "cookies" is already set', () => {
    getItemSpy.mockReturnValue('accepted');
    const { container } = render(<CookieBanner />);
    expect(container.firstChild).toBeNull();
  });
});
