/**
 * Safari with "Block All Cookies" (and Chrome with on-device site data blocked) throws a
 * SecurityError on any Web Storage access. These wrappers degrade to "no stored value"
 * instead of crashing the render tree, and are also safe to call during SSR.
 */
const makeSafeStorage = (getStorage: () => Storage) => ({
  getItem(key: string) {
    try {
      return getStorage().getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      getStorage().setItem(key, value);
    } catch {
      // Storage unavailable; features relying on persistence quietly degrade
    }
  },
  removeItem(key: string) {
    try {
      getStorage().removeItem(key);
    } catch {
      // Storage unavailable; features relying on persistence quietly degrade
    }
  },
});

export const safeSessionStorage = makeSafeStorage(() => window.sessionStorage);
export const safeLocalStorage = makeSafeStorage(() => window.localStorage);
