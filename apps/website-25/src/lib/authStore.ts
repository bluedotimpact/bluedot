import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TODO: handle automatically logging out when the token expires

export interface Auth {
  token: string,
  expiresAt: number,
}

export const useAuthStore = create<{
  auth: Auth | null,
  setAuth:(auth: Auth | null) => void,
}>()(persist((set) => ({
  auth: null,
  setAuth: (auth) => set({ auth }),
}), {
  name: 'bluedot_auth',
  version: 20231213,
}));
