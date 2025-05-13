import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CookieBanner } from './CookieBanner';
import { useConsentStore } from './analytics/consent';

vi.mock('./analytics/consent', () => {
  const mockAccept = vi.fn();
  const mockReject = vi.fn();

  const state = {
    isConsented: undefined,
    accept: mockAccept,
    reject: mockReject,
  };

  const mockUseConsentStore = vi.fn().mockImplementation((selector) => selector(state));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockUseConsentStore as any).getState = vi.fn().mockImplementation(() => state);

  return {
    useConsentStore: mockUseConsentStore,
  };
});

describe('CookieBanner', () => {
  // Mock functions for the store
  let mockAccept: ReturnType<typeof vi.fn>;
  let mockReject: ReturnType<typeof vi.fn>;
  let mockState: { isConsented: boolean | undefined, accept: () => void, reject: () => void };

  beforeEach(() => {
    mockState = useConsentStore.getState();
    mockState.isConsented = undefined;
    mockAccept = mockState.accept as unknown as ReturnType<typeof vi.fn>;
    mockReject = mockState.reject as unknown as ReturnType<typeof vi.fn>;
  });

  test('renders as expected', () => {
    const { container } = render(<CookieBanner />);
    expect(container).toMatchSnapshot();
  });

  test('calls accept method from consent store when accepted', () => {
    const { container } = render(<CookieBanner />);
    const acceptButton = container.querySelector('.cookie-banner__button--accept');

    expect(acceptButton).not.toBeNull();

    fireEvent.click(acceptButton!);

    expect(mockAccept).toHaveBeenCalled();
  });

  test('calls reject method from consent store when rejected', () => {
    const { container } = render(<CookieBanner />);
    const rejectButton = container.querySelector('.cookie-banner__button--reject');

    expect(rejectButton).not.toBeNull();

    fireEvent.click(rejectButton!);

    expect(mockReject).toHaveBeenCalled();
  });

  test('does not render if consent is already set to true', () => {
    mockState.isConsented = true;

    const { container } = render(<CookieBanner />);
    expect(container.firstChild).toBeNull();
  });

  test('does not render if consent is already set to false', () => {
    mockState.isConsented = false;

    const { container } = render(<CookieBanner />);
    expect(container.firstChild).toBeNull();
  });
});
