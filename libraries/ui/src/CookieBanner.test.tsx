import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner', () => {
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

  beforeEach(() => {
    localStorage.clear();
    setItemSpy.mockClear();
  });

  test('renders as expected', () => {
    const { container } = render(<CookieBanner />);
    expect(container).toMatchSnapshot();
  });

  test('sets localStorage item when accepted', () => {
    const { container } = render(<CookieBanner />);
    const acceptButton = container.querySelector('.cookie-banner__button--accept');

    expect(acceptButton).not.toBeNull();

    fireEvent.click(acceptButton!);

    expect(setItemSpy).toHaveBeenCalledWith('cookies', 'accepted');
  });

  test('sets localStorage item when rejected', () => {
    const { container } = render(<CookieBanner />);
    const rejectButton = container.querySelector('.cookie-banner__button--reject');

    expect(rejectButton).not.toBeNull();

    fireEvent.click(rejectButton!);

    expect(setItemSpy).toHaveBeenCalledWith('cookies', 'rejected');
  });
});
