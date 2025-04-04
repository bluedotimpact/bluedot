import { vi } from 'vitest';

let originalIntersectionObserver: typeof IntersectionObserver | null = null;

const isMock = (val: unknown): boolean => {
  return vi.isMockFunction(val);
};

/**
 * Mocks the IntersectionObserver API for testing purposes.
 */
export function mockIntersectionObserver() {
  const currentIntersectionObserver = window.IntersectionObserver;
  if (!isMock(currentIntersectionObserver)) {
    originalIntersectionObserver = currentIntersectionObserver;
  }

  const observeMock = vi.fn();
  const unobserveMock = vi.fn();
  const disconnectMock = vi.fn();

  const mockIO = vi.fn(function mockIO() {
    // @ts-ignore
    const self = this as IntersectionObserver;
    self.observe = observeMock;
    self.unobserve = unobserveMock;
    self.disconnect = disconnectMock;
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIO,
  });
}

export function cleanupGlobalMocks() {
  const currentIntersectionObserver = window.IntersectionObserver;
  if (isMock(currentIntersectionObserver) && !isMock(originalIntersectionObserver)) {
    window.IntersectionObserver = originalIntersectionObserver!;
  }
}
