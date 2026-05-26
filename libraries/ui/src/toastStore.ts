import { create } from 'zustand';

export type ToastVariant = 'default' | 'success';

export type ToastOptions = {
  id?: string;
  description?: string;
  duration?: number;
  closeButton?: boolean;
};

export type ToastEntry = {
  id: string;
  message: string;
  description?: string;
  duration: number;
  variant: ToastVariant;
  closeButton: boolean;
  status: 'visible' | 'exiting';
};

export const TOAST_VISIBLE_CAP = 3;
export const TOAST_DEFAULT_DURATION = 4000;
export const TOAST_EXIT_DURATION_MS = 150;

type ToastStore = {
  toasts: ToastEntry[];
  queue: ToastEntry[];
  paused: boolean;
  add: (entry: Omit<ToastEntry, 'status'>) => void;
  startExit: (id: string) => void;
  remove: (id: string) => void;
  setPaused: (paused: boolean) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  queue: [],
  paused: false,
  add: (entry) =>
    set((state) => {
      const existingVisible = state.toasts.findIndex((t) => t.id === entry.id);
      if (existingVisible !== -1) {
        const next = [...state.toasts];
        next[existingVisible] = { ...entry, status: 'visible' };
        return { toasts: next };
      }

      const existingQueued = state.queue.findIndex((t) => t.id === entry.id);
      if (existingQueued !== -1) {
        const next = [...state.queue];
        next[existingQueued] = { ...entry, status: 'visible' };
        return { queue: next };
      }

      if (state.toasts.length >= TOAST_VISIBLE_CAP) {
        return { queue: [...state.queue, { ...entry, status: 'visible' }] };
      }

      return { toasts: [...state.toasts, { ...entry, status: 'visible' }] };
    }),
  startExit: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, status: 'exiting' } : t)),
    })),
  remove: (id) =>
    set((state) => {
      const toasts = state.toasts.filter((t) => t.id !== id);
      const queue = [...state.queue];
      while (toasts.length < TOAST_VISIBLE_CAP && queue.length > 0) {
        toasts.push(queue.shift()!);
      }

      return { toasts, queue };
    }),
  setPaused: (paused) => set({ paused }),
}));

const enqueue = (message: string, variant: ToastVariant, opts: ToastOptions = {}): string => {
  const id = opts.id ?? crypto.randomUUID();
  useToastStore.getState().add({
    id,
    message,
    description: opts.description,
    duration: opts.duration ?? TOAST_DEFAULT_DURATION,
    variant,
    closeButton: opts.closeButton ?? false,
  });
  return id;
};

export const toast = Object.assign((message: string, opts?: ToastOptions) => enqueue(message, 'default', opts), {
  success: (message: string, opts?: ToastOptions) => enqueue(message, 'success', opts),
});
