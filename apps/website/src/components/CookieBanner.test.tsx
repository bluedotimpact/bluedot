import {
  beforeEach,
  describe,
  expect,
  type MockedFunction,
  test,
  vi,
} from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
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
  let mockAccept: MockedFunction<() => void>;
  let mockReject: MockedFunction<() => void>;
  let mockState: { isConsented: boolean | undefined; accept: () => void; reject: () => void };

  beforeEach(() => {
    mockState = useConsentStore.getState();
    mockState.isConsented = undefined;
    mockAccept = vi.mocked(mockState.accept);
    mockReject = vi.mocked(mockState.reject);
  });

  test('renders as expected', () => {
    const { container } = render(<CookieBanner />);
    expect(container).toMatchSnapshot();
  });

  test('calls accept method from consent store when accepted', () => {
    render(<CookieBanner />);
    const acceptButton = screen.getByText('Accept all');

    fireEvent.click(acceptButton);

    expect(mockAccept).toHaveBeenCalled();
  });

  test('calls reject method from consent store when rejected', () => {
    render(<CookieBanner />);
    const rejectButton = screen.getByText('Reject all');

    fireEvent.click(rejectButton);
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
