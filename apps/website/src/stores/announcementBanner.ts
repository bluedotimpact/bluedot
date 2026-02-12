import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAnnouncementBannerStore = create<{
  dismissedBanners: Record<string, boolean>;
  dismissBanner: (key: string) => void;
}>()(persist(
  (set) => ({
    dismissedBanners: {},
    dismissBanner: (key: string) => set((state) => ({
      dismissedBanners: { ...state.dismissedBanners, [key]: true },
    })),
  }),
  {
    name: 'bluedot_announcement_banners',
    version: 20250826,
  },
));
