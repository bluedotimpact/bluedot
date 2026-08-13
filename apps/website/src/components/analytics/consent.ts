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
}));
