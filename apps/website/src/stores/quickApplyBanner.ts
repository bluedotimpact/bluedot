import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useQuickApplyBannerStore = create<{
  dismissedKeys: Record<string, boolean>;
  dismiss: (key: string) => void;
}>()(persist(
  (set) => ({
    dismissedKeys: {},
    dismiss: (key: string) => set((state) => ({
      dismissedKeys: { ...state.dismissedKeys, [key]: true },
    })),
  }),
  {
    name: 'bluedot_quick_apply_banner',
  },
));
