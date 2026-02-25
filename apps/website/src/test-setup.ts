// Global test setup file
// This file is run before all tests in apps/website

// Fix timezone as UTC
// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env.TZ = 'UTC';

// Mock localStorage for msw CookieStore (required before msw modules are loaded)
const localStorageMock = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
  clear() {},
  length: 0,
  key: () => null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
