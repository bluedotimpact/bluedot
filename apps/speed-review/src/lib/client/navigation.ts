import { create } from 'zustand';

export const useNavigationState = create<{
  sessionActive: boolean;
  pendingWrites: number;
  promptOpen: boolean;
  setSessionActive: (active: boolean) => void;
}>((set) => ({
      sessionActive: false,
      pendingWrites: 0,
      promptOpen: false,
      setSessionActive: (sessionActive) => set({ sessionActive }),
    }));
