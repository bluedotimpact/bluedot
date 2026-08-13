import {
  afterEach, describe, expect, test,
} from 'vitest';
import { safeLocalStorage, safeSessionStorage } from './safeStorage';

const blockStorage = (name: 'sessionStorage' | 'localStorage') => {
  Object.defineProperty(globalThis, name, {
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
    configurable: true,
  });
};

const stubStorage = (name: 'sessionStorage' | 'localStorage') => {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, name, {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    },
    writable: true,
    configurable: true,
  });
  return store;
};

// defineProperty stubs aren't tracked by vi.stubGlobal, so restore working storage by hand
afterEach(() => {
  stubStorage('sessionStorage');
  stubStorage('localStorage');
});

describe.each([
  ['safeSessionStorage', safeSessionStorage, 'sessionStorage'],
  ['safeLocalStorage', safeLocalStorage, 'localStorage'],
] as const)('%s', (_, storage, globalName) => {
  test('passes through when storage is available', () => {
    const store = stubStorage(globalName);

    storage.setItem('key', 'value');
    expect(store.key).toBe('value');
    expect(storage.getItem('key')).toBe('value');

    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  test('degrades without throwing when storage access throws SecurityError', () => {
    blockStorage(globalName);

    expect(storage.getItem('key')).toBeNull();
    expect(() => storage.setItem('key', 'value')).not.toThrow();
    expect(() => storage.removeItem('key')).not.toThrow();
  });
});
