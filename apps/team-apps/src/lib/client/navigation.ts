import { create } from 'zustand';

export const useNavigationState = create<{
  sessionActive: boolean;
  pendingWrites: number;
  candidatePendingWrites: number;
  unsavedChanges: boolean;
  promptOpen: boolean;
  setSessionActive: (active: boolean) => void;
}>((set) => ({
      sessionActive: false,
      pendingWrites: 0,
      candidatePendingWrites: 0,
      unsavedChanges: false,
      promptOpen: false,
      setSessionActive: (sessionActive) => set({ sessionActive }),
    }));
