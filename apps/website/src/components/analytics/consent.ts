import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConsentStore = create<{
  isConsented: boolean | undefined;
  accept: () => void;
  reject: () => void;
}>()(persist((set) => ({
  isConsented: undefined,
  accept() {
    set({ isConsented: true });
  },
  reject() {
    set({ isConsented: false });
  },
}), {
  name: 'bluedot_consent',
  version: 20250513,

  // For backwards compatibility with previous consent system
  // TODO: remove this after 2025-07-01, when most people will have migrated over
  onRehydrateStorage: () => (state) => {
    if (state && state.isConsented === undefined) {
      switch (localStorage.getItem('cookies')) {
        case 'accepted':
          state.accept();
          break;
        case 'rejected':
          state.reject();
          break;
        default:
      }
    }
  },
}));
